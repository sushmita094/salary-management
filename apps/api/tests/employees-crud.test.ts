import type { CreateEmployee } from "@acme/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { authedRequest } from "./helpers/auth.js";
import { migrateTestDb } from "./helpers/db.js";

const app = createApp();
const api = authedRequest(app);

/** A valid-format uuid that is never seeded, for the "missing record" paths. */
const MISSING_ID = "11111111-1111-4111-8111-111111111111";

const ADA: CreateEmployee = {
  name: "Ada Lovelace",
  email: "ada@acme.example",
  country: "United Kingdom",
  department: "Engineering",
  jobTitle: "Software Engineer",
  level: "Principal",
  salaryAmount: 120_000,
  salaryCurrency: "GBP",
};

const GRACE: CreateEmployee = {
  name: "Grace Hopper",
  email: "grace@acme.example",
  country: "United States",
  department: "Engineering",
  jobTitle: "Software Engineer",
  level: "Staff",
  salaryAmount: 180_000,
  salaryCurrency: "USD",
};

let adaId: string;

beforeAll(() => {
  migrateTestDb();
});

// Each test starts from the same two-row baseline, since these tests mutate data.
beforeEach(async () => {
  await prisma.employee.deleteMany();
  const ada = await prisma.employee.create({ data: ADA });
  await prisma.employee.create({ data: GRACE });
  adaId = ada.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /employees/:id", () => {
  it("returns the employee when it exists", async () => {
    const res = await api.get(`/employees/${adaId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: adaId, name: "Ada Lovelace", email: "ada@acme.example" });
  });

  it("returns 404 for a well-formed but unknown id", async () => {
    const res = await api.get(`/employees/${MISSING_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for a malformed id", async () => {
    const res = await api.get("/employees/not-a-uuid");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /employees", () => {
  const NEW_EMPLOYEE: CreateEmployee = {
    name: "Katherine Johnson",
    email: "katherine@acme.example",
    country: "United States",
    department: "Data & Analytics",
    jobTitle: "Data Scientist",
    level: "Senior",
    salaryAmount: 150_000,
    salaryCurrency: "USD",
  };

  it("creates the employee and returns 201 with the server-assigned fields", async () => {
    const res = await api.post("/employees").send(NEW_EMPLOYEE);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(NEW_EMPLOYEE);
    expect(typeof res.body.id).toBe("string");
    expect(typeof res.body.createdAt).toBe("string");
    expect(await prisma.employee.count()).toBe(3);
  });

  it("returns 409 on a duplicate email", async () => {
    const res = await api.post("/employees").send({ ...NEW_EMPLOYEE, email: "ada@acme.example" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("returns 400 with field details for an invalid body", async () => {
    const res = await api.post("/employees").send({ ...NEW_EMPLOYEE, salaryCurrency: "Dollars", salaryAmount: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});

describe("PUT /employees/:id", () => {
  it("applies a partial update and returns 200 with the new values", async () => {
    const res = await api.put(`/employees/${adaId}`).send({ salaryAmount: 130_000 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: adaId, salaryAmount: 130_000, name: "Ada Lovelace" });
  });

  it("returns 404 when the id is unknown", async () => {
    const res = await api.put(`/employees/${MISSING_ID}`).send({ salaryAmount: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 409 when changing the email to one already taken", async () => {
    const res = await api.put(`/employees/${adaId}`).send({ email: "grace@acme.example" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("returns 400 for an invalid field", async () => {
    const res = await api.put(`/employees/${adaId}`).send({ salaryCurrency: "Euro" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /employees/:id", () => {
  it("removes the employee and returns 204", async () => {
    const res = await api.delete(`/employees/${adaId}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(await prisma.employee.findUnique({ where: { id: adaId } })).toBeNull();
  });

  it("returns 404 when the id is unknown", async () => {
    const res = await api.delete(`/employees/${MISSING_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
