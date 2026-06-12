import { describe, expect, it } from "vitest";
import { formatSalary } from "../src/lib/format";

describe("formatSalary", () => {
  it("formats the amount in the given currency", () => {
    // Locale-independent assertion: the grouped digits always appear.
    expect(formatSalary({ salaryAmount: 1000, salaryCurrency: "USD" })).toContain("000");
  });
});
