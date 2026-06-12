import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, employeeQuerySchema } from "./query.js";

describe("employeeQuerySchema", () => {
  it("applies sane defaults when no params are given", () => {
    expect(employeeQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: "name",
      order: "asc",
    });
  });

  it("coerces numeric strings from the query string", () => {
    const parsed = employeeQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(50);
  });

  it("rejects a page below 1", () => {
    expect(() => employeeQuerySchema.parse({ page: "0" })).toThrow();
  });

  it("rejects a pageSize above the cap", () => {
    expect(() => employeeQuerySchema.parse({ pageSize: String(MAX_PAGE_SIZE + 1) })).toThrow();
  });

  it("rejects a non-whitelisted sort column", () => {
    expect(() => employeeQuerySchema.parse({ sort: "id" })).toThrow();
  });

  it("rejects an unknown order", () => {
    expect(() => employeeQuerySchema.parse({ order: "sideways" })).toThrow();
  });

  it("keeps optional filters when provided", () => {
    const parsed = employeeQuerySchema.parse({ search: "ada", country: "Germany" });
    expect(parsed.search).toBe("ada");
    expect(parsed.country).toBe("Germany");
  });
});
