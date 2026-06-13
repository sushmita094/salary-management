import { describe, expect, it } from "vitest";
import { exportQuerySchema, importRowSchema } from "./import.js";

describe("importRowSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@acme.example",
    country: "United Kingdom",
    department: "Engineering",
    jobTitle: "Software Engineer",
    level: "Principal",
    salaryAmount: "120000", // strings arrive from CSV cells
    salaryCurrency: "GBP",
  };

  it("accepts a good row and coerces the salary to a number", () => {
    expect(importRowSchema.parse(valid)).toMatchObject({ salaryAmount: 120000 });
  });

  it("trims surrounding whitespace on text fields", () => {
    expect(importRowSchema.parse({ ...valid, name: "  Ada Lovelace  " }).name).toBe("Ada Lovelace");
  });

  it("rejects a bad email", () => {
    expect(() => importRowSchema.parse({ ...valid, email: "nope" })).toThrow();
  });

  it("rejects a negative salary and a non-ISO currency", () => {
    expect(() => importRowSchema.parse({ ...valid, salaryAmount: "-1" })).toThrow();
    expect(() => importRowSchema.parse({ ...valid, salaryCurrency: "Pounds" })).toThrow();
  });
});

describe("exportQuerySchema", () => {
  it("defaults the format to csv and keeps the directory sort defaults", () => {
    expect(exportQuerySchema.parse({})).toMatchObject({ format: "csv", sort: "name", order: "asc" });
  });

  it("does not accept pagination params as known fields", () => {
    expect("page" in exportQuerySchema.shape).toBe(false);
    expect("pageSize" in exportQuerySchema.shape).toBe(false);
  });
});
