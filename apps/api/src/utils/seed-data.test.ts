import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  DEPARTMENTS,
  LEVELS,
  generateEmployees,
} from "./seed-data.js";

describe("generateEmployees", () => {
  it("generates exactly the requested number of employees", () => {
    expect(generateEmployees(100)).toHaveLength(100);
  });

  it("is deterministic — the same call produces identical data", () => {
    expect(generateEmployees(50)).toEqual(generateEmployees(50));
  });

  it("gives every employee a unique email (the import/upsert key)", () => {
    const emails = generateEmployees(2000).map((e) => e.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("always assigns a positive, finite salary", () => {
    for (const e of generateEmployees(500)) {
      expect(Number.isFinite(e.salaryAmount)).toBe(true);
      expect(e.salaryAmount).toBeGreaterThan(0);
    }
  });

  it("pairs each employee with their country's local currency", () => {
    const currencyOf = new Map<string, string>(COUNTRIES.map((c) => [c.name, c.currency]));
    for (const e of generateEmployees(500)) {
      expect(e.salaryCurrency).toBe(currencyOf.get(e.country));
    }
  });

  it("only uses known countries, departments, job titles, and levels", () => {
    const countries = new Set<string>(COUNTRIES.map((c) => c.name));
    const levels = new Set<string>(LEVELS.map((l) => l.name));
    for (const e of generateEmployees(500)) {
      expect(countries.has(e.country)).toBe(true);
      expect(levels.has(e.level)).toBe(true);
      expect(DEPARTMENTS[e.department]).toContain(e.jobTitle);
    }
  });

  it("spreads people across many countries and levels (not a toy dataset)", () => {
    const sample = generateEmployees(1000);
    expect(new Set(sample.map((e) => e.country)).size).toBeGreaterThan(5);
    expect(new Set(sample.map((e) => e.level)).size).toBeGreaterThan(4);
  });

  it("makes senior bands pay more than junior bands on average (realistic spread)", () => {
    const sample = generateEmployees(3000).filter((e) => e.country === "United States");
    const mean = (level: string) => {
      const xs = sample.filter((e) => e.level === level).map((e) => e.salaryAmount);
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    };
    expect(mean("Principal")).toBeGreaterThan(mean("Junior"));
  });
});
