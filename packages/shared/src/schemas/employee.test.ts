import { describe, expect, it } from "vitest";
import { createEmployeeSchema, employeeSchema } from "./employee.js";

describe("employeeSchema", () => {
  const valid = {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    name: "Ada Lovelace",
    email: "ada@acme.example",
    country: "United Kingdom",
    department: "Engineering",
    jobTitle: "Principal Engineer",
    salaryAmount: 120000,
    salaryCurrency: "GBP",
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

  it("createEmployeeSchema omits id", () => {
    expect("id" in createEmployeeSchema.shape).toBe(false);
  });
});
