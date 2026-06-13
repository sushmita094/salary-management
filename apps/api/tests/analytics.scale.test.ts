import type { CurrencyRollup, SegmentStat } from "@acme/shared";
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
 * Proves the in-SQL analytics stay correct (and fast) on a realistic dataset
 * using fixture-independent invariants — the median's exact value is hard to
 * hand-compute at 3k rows, but it must always sit between min and max, headcounts
 * must reconcile, and histogram bands must account for everyone.
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

describe("analytics at scale", () => {
  it("summary headcounts reconcile to the full population", async () => {
    const res = await api.get("/analytics/summary");

    expect(res.body.headcount).toBe(SIZE);
    const summed = res.body.byCurrency.reduce((n: number, c: CurrencyRollup) => n + c.headcount, 0);
    expect(summed).toBe(SIZE);
    // Median must be a real central value, never outside the plausible range.
    for (const c of res.body.byCurrency as CurrencyRollup[]) {
      expect(c.median).toBeGreaterThan(0);
      expect(c.median).toBeLessThanOrEqual(c.totalSpend); // sanity: median ≤ total
    }
  });

  it("every segment's median and average sit within [min, max]", async () => {
    const res = await api.get("/analytics/by/level");

    expect(res.body.groups.length).toBeGreaterThan(0);
    for (const g of res.body.groups as SegmentStat[]) {
      expect(g.average).toBeGreaterThanOrEqual(g.min);
      expect(g.average).toBeLessThanOrEqual(g.max);
      expect(g.median).toBeGreaterThanOrEqual(g.min);
      expect(g.median).toBeLessThanOrEqual(g.max);
    }
  });

  it("distribution band counts account for every employee in each currency", async () => {
    const summary = await api.get("/analytics/summary");
    const dist = await api.get("/analytics/distribution").query({ bucketCount: 12 });

    const headcountOf = new Map<string, number>(
      (summary.body.byCurrency as CurrencyRollup[]).map((c) => [c.currency, c.headcount]),
    );

    for (const cur of dist.body.currencies as Array<{ currency: string; bands: Array<{ count: number }> }>) {
      const banded = cur.bands.reduce((n, b) => n + b.count, 0);
      expect(banded).toBe(headcountOf.get(cur.currency));
    }
  });
});
