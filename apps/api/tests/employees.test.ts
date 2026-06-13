import type { CreateEmployee } from "@acme/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { authedRequest } from "./helpers/auth.js";
import { migrateTestDb } from "./helpers/db.js";

const app = createApp();
const api = authedRequest(app);

/** A small, hand-picked fixture with enough variety to exercise every list feature. */
const FIXTURE: CreateEmployee[] = [
  { name: "Ada Lovelace", email: "ada@acme.example", country: "United Kingdom", department: "Engineering", jobTitle: "Software Engineer", level: "Principal", salaryAmount: 120_000, salaryCurrency: "GBP" },
  { name: "Alan Turing", email: "alan@acme.example", country: "United Kingdom", department: "Engineering", jobTitle: "Backend Engineer", level: "Senior", salaryAmount: 95_000, salaryCurrency: "GBP" },
  { name: "Grace Hopper", email: "grace@acme.example", country: "United States", department: "Engineering", jobTitle: "Software Engineer", level: "Staff", salaryAmount: 180_000, salaryCurrency: "USD" },
  { name: "Katherine Johnson", email: "katherine@acme.example", country: "United States", department: "Data & Analytics", jobTitle: "Data Scientist", level: "Senior", salaryAmount: 150_000, salaryCurrency: "USD" },
  { name: "Edsger Dijkstra", email: "edsger@acme.example", country: "Netherlands", department: "Engineering", jobTitle: "Software Engineer", level: "Principal", salaryAmount: 110_000, salaryCurrency: "EUR" },
  { name: "Margaret Hamilton", email: "margaret@acme.example", country: "United States", department: "Engineering", jobTitle: "Engineering Manager", level: "Manager", salaryAmount: 200_000, salaryCurrency: "USD" },
  { name: "Linus Torvalds", email: "linus@acme.example", country: "France", department: "Engineering", jobTitle: "Software Engineer", level: "Mid", salaryAmount: 70_000, salaryCurrency: "EUR" },
];

beforeAll(async () => {
  migrateTestDb();
  await prisma.employee.deleteMany();
  await prisma.employee.createMany({ data: FIXTURE });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /employees", () => {
  it("returns the standard envelope, default-sorted by name asc", async () => {
    const res = await api.get("/employees");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 20, total: 7, totalPages: 1 });
    expect(res.body.data).toHaveLength(7);
    expect(res.body.data[0].name).toBe("Ada Lovelace");
    // Server-assigned fields are serialised onto the wire.
    expect(typeof res.body.data[0].id).toBe("string");
    expect(typeof res.body.data[0].createdAt).toBe("string");
  });

  it("searches name/email case-insensitively (hit)", async () => {
    const res = await api.get("/employees").query({ search: "ADA" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe("ada@acme.example");
  });

  it("returns an empty page for a search miss", async () => {
    const res = await api.get("/employees").query({ search: "zzzzz" });

    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  });

  it("filters by country", async () => {
    const res = await api.get("/employees").query({ country: "United States" });

    expect(res.body.pagination.total).toBe(3);
    expect(res.body.data.every((e: { country: string }) => e.country === "United States")).toBe(true);
  });

  it("filters by department", async () => {
    const res = await api.get("/employees").query({ department: "Data & Analytics" });

    expect(res.body.data.map((e: { name: string }) => e.name)).toEqual(["Katherine Johnson"]);
  });

  it("filters by level", async () => {
    const res = await api.get("/employees").query({ level: "Senior" });

    expect(res.body.pagination.total).toBe(2);
    expect(res.body.data.map((e: { name: string }) => e.name).sort()).toEqual([
      "Alan Turing",
      "Katherine Johnson",
    ]);
  });

  it("sorts by salary ascending and descending", async () => {
    const asc = await api.get("/employees").query({ sort: "salaryAmount", order: "asc" });
    const desc = await api.get("/employees").query({ sort: "salaryAmount", order: "desc" });

    expect(asc.body.data[0].name).toBe("Linus Torvalds"); // 70,000
    expect(desc.body.data[0].name).toBe("Margaret Hamilton"); // 200,000
  });

  it("paginates and clamps a page past the end to the last page", async () => {
    const first = await api.get("/employees").query({ pageSize: 2, page: 1 });
    expect(first.body.data).toHaveLength(2);
    expect(first.body.pagination).toEqual({ page: 1, pageSize: 2, total: 7, totalPages: 4 });

    const beyond = await api.get("/employees").query({ pageSize: 2, page: 99 });
    expect(beyond.body.pagination.page).toBe(4);
    expect(beyond.body.data).toHaveLength(1); // 7 rows → last page holds the remainder
  });

  it("rejects a non-whitelisted sort column with a 400 error envelope", async () => {
    const res = await api.get("/employees").query({ sort: "id" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("rejects a page below 1", async () => {
    const res = await api.get("/employees").query({ page: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
