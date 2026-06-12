import { describe, expect, it } from "vitest";
import {
  createEmployeeSchema,
  employeeSchema,
  updateEmployeeSchema,
} from "./employee.js";

describe("employeeSchema", () => {
  const valid = {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "Ada Lovelace",
    email: "ada@acme.example",
    country: "United Kingdom",
    department: "Engineering",
    jobTitle: "Principal Engineer",
    level: "Principal",
    salaryAmount: 120000,
    salaryCurrency: "GBP",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("accepts a well-formed employee", () => {
    expect(employeeSchema.parse(valid)).toEqual(valid);
  });

  it("rejects a non-ISO currency code", () => {
    expect(() => employeeSchema.parse({ ...valid, salaryCurrency: "Pounds" })).toThrow();
  });

  it("rejects a negative salary", () => {
    expect(() => employeeSchema.parse({ ...valid, salaryAmount: -1 })).toThrow();
  });

  it("rejects a missing level", () => {
    const { level: _level, ...withoutLevel } = valid;
    expect(() => employeeSchema.parse(withoutLevel)).toThrow();
  });

  it("rejects a non-datetime createdAt", () => {
    expect(() => employeeSchema.parse({ ...valid, createdAt: "yesterday" })).toThrow();
  });
});

describe("createEmployeeSchema", () => {
  it("omits server-assigned fields", () => {
    expect("id" in createEmployeeSchema.shape).toBe(false);
    expect("createdAt" in createEmployeeSchema.shape).toBe(false);
    expect("updatedAt" in createEmployeeSchema.shape).toBe(false);
  });

  it("still requires the business fields", () => {
    expect(() => createEmployeeSchema.parse({ name: "Bob" })).toThrow();
  });
});

describe("updateEmployeeSchema", () => {
  it("accepts a partial payload", () => {
    expect(updateEmployeeSchema.parse({ salaryAmount: 95000 })).toEqual({
      salaryAmount: 95000,
    });
  });

  it("accepts an empty payload", () => {
    expect(updateEmployeeSchema.parse({})).toEqual({});
  });

  it("still validates provided fields", () => {
    expect(() => updateEmployeeSchema.parse({ salaryCurrency: "Euro" })).toThrow();
  });
});
