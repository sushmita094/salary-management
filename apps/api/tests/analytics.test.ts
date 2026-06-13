import type { CreateEmployee, CurrencyRollup, SegmentStat } from "@acme/shared";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { migrateTestDb } from "./helpers/db.js";

const app = createApp();

/**
 * Hand-computable fixture: two currencies so per-currency separation is provable.
 *   USD salaries: 100k, 300k (Eng) + 200k, 400k (Sales) → avg 250k, median 250k.
 *   EUR salaries: 50k, 90k (Eng) + 70k (Sales)          → avg 70k,  median 70k.
 */
const emp = (
  name: string,
  country: string,
  department: string,
  salaryAmount: number,
  salaryCurrency: string,
): CreateEmployee => ({
  name,
  email: `${name.toLowerCase().replace(/\s/g, ".")}@acme.example`,
  country,
  department,
  jobTitle: "Engineer",
  level: "Senior",
  salaryAmount,
  salaryCurrency,
});

const FIXTURE: CreateEmployee[] = [
  emp("US Eng A", "United States", "Engineering", 100_000, "USD"),
  emp("US Eng B", "United States", "Engineering", 300_000, "USD"),
  emp("US Sales A", "United States", "Sales", 200_000, "USD"),
  emp("US Sales B", "United States", "Sales", 400_000, "USD"),
  emp("DE Eng A", "Germany", "Engineering", 50_000, "EUR"),
  emp("DE Eng B", "Germany", "Engineering", 90_000, "EUR"),
  emp("DE Sales A", "Germany", "Sales", 70_000, "EUR"),
];

const byCurrency = (rows: CurrencyRollup[], currency: string) =>
  rows.find((r) => r.currency === currency)!;
const segment = (rows: SegmentStat[], value: string, currency: string) =>
  rows.find((r) => r.value === value && r.currency === currency)!;

beforeAll(async () => {
  migrateTestDb();
  await prisma.employee.deleteMany();
  await prisma.employee.createMany({ data: FIXTURE });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /analytics/summary", () => {
  it("reports headcount overall and money per currency (avg + median)", async () => {
    const res = await request(app).get("/analytics/summary");

    expect(res.status).toBe(200);
    expect(res.body.headcount).toBe(7);

    const usd = byCurrency(res.body.byCurrency, "USD");
    expect(usd).toMatchObject({ headcount: 4, totalSpend: 1_000_000, average: 250_000, median: 250_000 });

    const eur = byCurrency(res.body.byCurrency, "EUR");
    expect(eur).toMatchObject({ headcount: 3, totalSpend: 210_000, average: 70_000, median: 70_000 });
  });
});

describe("GET /analytics/by/:dimension", () => {
  it("computes per-(department × currency) avg/median/min/max", async () => {
    const res = await request(app).get("/analytics/by/department");

    expect(res.status).toBe(200);
    expect(res.body.dimension).toBe("department");

    expect(segment(res.body.groups, "Engineering", "USD")).toMatchObject({
      headcount: 2, average: 200_000, median: 200_000, min: 100_000, max: 300_000,
    });
    expect(segment(res.body.groups, "Sales", "USD")).toMatchObject({
      headcount: 2, average: 300_000, median: 300_000, min: 200_000, max: 400_000,
    });
    expect(segment(res.body.groups, "Sales", "EUR")).toMatchObject({
      headcount: 1, average: 70_000, median: 70_000, min: 70_000, max: 70_000,
    });
  });

  it("slices by country as a single currency per country", async () => {
    const res = await request(app).get("/analytics/by/country");

    expect(segment(res.body.groups, "United States", "USD")).toMatchObject({
      headcount: 4, average: 250_000, median: 250_000,
    });
    expect(segment(res.body.groups, "Germany", "EUR")).toMatchObject({
      headcount: 3, average: 70_000, median: 70_000,
    });
  });

  it("rejects an unknown dimension with a 400 error envelope", async () => {
    const res = await request(app).get("/analytics/by/salary");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /analytics/distribution", () => {
  it("returns equal-width pay bands per currency", async () => {
    const res = await request(app).get("/analytics/distribution").query({ bucketCount: 4 });

    expect(res.status).toBe(200);
    expect(res.body.bucketCount).toBe(4);

    const usd = res.body.currencies.find((c: { currency: string }) => c.currency === "USD");
    expect(usd).toMatchObject({ min: 100_000, max: 400_000 });
    // USD 100k/200k/300k/400k → one per band across [100k,400k] split into 4.
    expect(usd.bands.map((b: { count: number }) => b.count)).toEqual([1, 1, 1, 1]);

    const eur = res.body.currencies.find((c: { currency: string }) => c.currency === "EUR");
    // EUR 50k/70k/90k over [50k,90k]/4 (width 10k): bands [50,60),[60,70),[70,80),[80,90].
    expect(eur.bands.map((b: { count: number }) => b.count)).toEqual([1, 0, 1, 1]);
  });

  it("scopes the histogram to a single currency when filtered", async () => {
    const res = await request(app).get("/analytics/distribution").query({ currency: "USD", bucketCount: 4 });

    expect(res.body.currencies).toHaveLength(1);
    expect(res.body.currencies[0].currency).toBe("USD");
  });
});
