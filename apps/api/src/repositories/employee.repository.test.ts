import type { EmployeeQuery } from "@acme/shared";
import { describe, expect, it } from "vitest";
import { buildOrderBy, buildWhere } from "./employee.repository.js";

/** A fully-defaulted query, overridable per test. */
function query(overrides: Partial<EmployeeQuery> = {}): EmployeeQuery {
  return { page: 1, pageSize: 20, sort: "name", order: "asc", ...overrides };
}

describe("buildWhere", () => {
  it("is empty when no search or filters are given", () => {
    expect(buildWhere(query())).toEqual({});
  });

  it("matches search against both name and email", () => {
    expect(buildWhere(query({ search: "ada" }))).toEqual({
      OR: [{ name: { contains: "ada" } }, { email: { contains: "ada" } }],
    });
  });

  it("turns each provided filter into an equality match", () => {
    expect(
      buildWhere(query({ country: "Germany", department: "Engineering", jobTitle: "Software Engineer", level: "Senior" })),
    ).toEqual({
      country: "Germany",
      department: "Engineering",
      jobTitle: "Software Engineer",
      level: "Senior",
    });
  });

  it("omits filters that were not provided", () => {
    expect(buildWhere(query({ country: "France" }))).toEqual({ country: "France" });
  });
});

describe("buildOrderBy", () => {
  it("orders by the requested column then by id as a stable tiebreak", () => {
    expect(buildOrderBy(query({ sort: "salaryAmount", order: "desc" }))).toEqual([
      { salaryAmount: "desc" },
      { id: "asc" },
    ]);
  });
});
