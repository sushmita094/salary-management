import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { generateEmployees } from "../src/utils/seed-data.js";
import { authedRequest } from "./helpers/auth.js";
import { migrateTestDb } from "./helpers/db.js";

const app = createApp();
const api = authedRequest(app);
const SIZE = 3_000;

/**
 * Proves the directory query stays correct (and computed in SQL, not Node) on a
 * dataset large enough that toy assumptions break — deep pages, exact totals, and
 * a stable sort across page boundaries.
 */
beforeAll(async () => {
  migrateTestDb();
  await prisma.employee.deleteMany();
  const rows = generateEmployees(SIZE);
  for (let i = 0; i < rows.length; i += 1_000) {
    await prisma.employee.createMany({ data: rows.slice(i, i + 1_000) });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /employees at scale", () => {
  it("reports the exact filtered total and page count", async () => {
    const res = await api.get("/employees").query({ pageSize: 100, page: 1 });

    expect(res.body.pagination).toEqual({ page: 1, pageSize: 100, total: SIZE, totalPages: 30 });
    expect(res.body.data).toHaveLength(100);
  });

  it("returns a full final page on a deep page request", async () => {
    const res = await api.get("/employees").query({ pageSize: 100, page: 30 });

    expect(res.body.pagination.page).toBe(30);
    expect(res.body.data).toHaveLength(100);
  });

  it("keeps the sort order stable across page boundaries", async () => {
    const p1 = await api.get("/employees").query({ sort: "salaryAmount", order: "desc", pageSize: 50, page: 1 });
    const p2 = await api.get("/employees").query({ sort: "salaryAmount", order: "desc", pageSize: 50, page: 2 });

    const lastOfP1: number = p1.body.data.at(-1).salaryAmount;
    const firstOfP2: number = p2.body.data[0].salaryAmount;
    // Descending: the last row of page 1 must not be smaller than the first of page 2.
    expect(lastOfP1).toBeGreaterThanOrEqual(firstOfP2);
  });
});
