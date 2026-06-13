import type { CreateEmployee } from "@acme/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { generateEmployees } from "../src/utils/seed-data.js";
import { migrateTestDb } from "./helpers/db.js";

const app = createApp();

const HEADER = "name,email,country,department,jobTitle,level,salaryAmount,salaryCurrency";
const csv = (...lines: string[]): Buffer => Buffer.from([HEADER, ...lines].join("\n"));
const attach = (req: request.Test, body: Buffer, filename = "employees.csv") =>
  req.attach("file", body, { filename, contentType: "text/csv" });

beforeAll(() => {
  migrateTestDb();
});

beforeEach(async () => {
  await prisma.employee.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /import", () => {
  it("imports a valid file and reports inserted counts", async () => {
    const res = await attach(
      request(app).post("/import"),
      csv(
        "Ada Lovelace,ada@acme.example,United Kingdom,Engineering,Software Engineer,Principal,120000,GBP",
        "Grace Hopper,grace@acme.example,United States,Engineering,Software Engineer,Staff,180000,USD",
      ),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ inserted: 2, updated: 0, failed: 0, rowErrors: [] });
    expect(await prisma.employee.count()).toBe(2);
  });

  it("reports bad rows without aborting the good ones (no silent corruption)", async () => {
    const res = await attach(
      request(app).post("/import"),
      csv(
        "Ada Lovelace,ada@acme.example,United Kingdom,Engineering,Software Engineer,Principal,120000,GBP",
        "Bad Row,not-an-email,United States,Engineering,Software Engineer,Staff,-5,Dollars",
      ),
    );

    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(1);
    expect(res.body.failed).toBe(1);
    expect(res.body.rowErrors[0].row).toBe(3); // header=1, good=2, bad=3
    expect(res.body.rowErrors[0].errors.length).toBeGreaterThan(0);
    // Only the valid row reached the database.
    expect(await prisma.employee.count()).toBe(1);
    expect(await prisma.employee.findUnique({ where: { email: "ada@acme.example" } })).not.toBeNull();
  });

  it("upserts by email — an existing employee is updated, not duplicated", async () => {
    await prisma.employee.create({
      data: {
        name: "Ada Lovelace",
        email: "ada@acme.example",
        country: "United Kingdom",
        department: "Engineering",
        jobTitle: "Software Engineer",
        level: "Senior",
        salaryAmount: 100000,
        salaryCurrency: "GBP",
      },
    });

    const res = await attach(
      request(app).post("/import"),
      csv("Ada Lovelace,ada@acme.example,United Kingdom,Engineering,Software Engineer,Principal,150000,GBP"),
    );

    expect(res.body).toMatchObject({ inserted: 0, updated: 1, failed: 0 });
    expect(await prisma.employee.count()).toBe(1);
    const ada = await prisma.employee.findUnique({ where: { email: "ada@acme.example" } });
    expect(ada).toMatchObject({ salaryAmount: 150000, level: "Principal" });
  });

  it("rejects a file whose headers don't match the format (400)", async () => {
    const wrongHeader = "fullName,email,country,department,jobTitle,level,salaryAmount,salaryCurrency";
    const body = Buffer.from(`${wrongHeader}\nAda,ada@acme.example,UK,Eng,SWE,Principal,120000,GBP`);

    const res = await attach(request(app).post("/import"), body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.missing).toContain("name");
  });

  it("returns 400 when no file is attached", async () => {
    const res = await request(app).post("/import");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("handles a large file (1,000 rows) in one import", async () => {
    const rows = generateEmployees(1_000).map(
      (e) =>
        `${e.name},${e.email},${e.country},${e.department},${e.jobTitle},${e.level},${e.salaryAmount},${e.salaryCurrency}`,
    );

    const res = await attach(request(app).post("/import"), csv(...rows));

    expect(res.body).toMatchObject({ inserted: 1_000, updated: 0, failed: 0 });
    expect(await prisma.employee.count()).toBe(1_000);
  });
});

describe("GET /export", () => {
  const FIXTURE: CreateEmployee[] = [
    { name: "Ada Lovelace", email: "ada@acme.example", country: "United Kingdom", department: "Engineering", jobTitle: "Software Engineer", level: "Principal", salaryAmount: 120000, salaryCurrency: "GBP" },
    { name: "Grace Hopper", email: "grace@acme.example", country: "United States", department: "Engineering", jobTitle: "Software Engineer", level: "Staff", salaryAmount: 180000, salaryCurrency: "USD" },
    { name: "Linus Torvalds", email: "linus@acme.example", country: "United States", department: "Engineering", jobTitle: "Software Engineer", level: "Mid", salaryAmount: 70000, salaryCurrency: "USD" },
  ];

  beforeEach(async () => {
    await prisma.employee.createMany({ data: FIXTURE });
  });

  it("exports the filtered view as CSV with a download filename", async () => {
    const res = await request(app).get("/export").query({ country: "United States" });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toMatch(/attachment; filename="employees-.*\.csv"/);

    const lines = res.text.trim().split("\n");
    expect(lines[0]).toBe(HEADER);
    expect(lines).toHaveLength(3); // header + 2 US rows; the UK row is filtered out
    expect(res.text).not.toContain("ada@acme.example");
  });

  it("round-trips: export → re-import reproduces the same employees", async () => {
    const exported = await request(app).get("/export"); // all three
    await prisma.employee.deleteMany();

    const reimport = await attach(request(app).post("/import"), Buffer.from(exported.text));

    expect(reimport.body).toMatchObject({ inserted: 3, updated: 0, failed: 0 });
    const ada = await prisma.employee.findUnique({ where: { email: "ada@acme.example" } });
    expect(ada).toMatchObject({ name: "Ada Lovelace", salaryAmount: 120000, salaryCurrency: "GBP" });
  });

  it("can emit an xlsx workbook", async () => {
    const res = await request(app).get("/export").query({ format: "xlsx" }).buffer();

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml");
    expect(res.headers["content-disposition"]).toContain(".xlsx");
  });
});
