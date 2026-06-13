import { describe, expect, it } from "vitest";
import { missingColumns, parseRows, toCsv } from "./spreadsheet.js";

const COLUMNS = ["name", "email", "salaryAmount"] as const;

describe("parseRows", () => {
  it("reads a CSV buffer into trimmed headers and keyed rows", () => {
    const csv = "name,email,salaryAmount\nAda Lovelace,ada@acme.example,120000\n";
    const { headers, rows } = parseRows(Buffer.from(csv));

    expect(headers).toEqual(["name", "email", "salaryAmount"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Ada Lovelace", email: "ada@acme.example" });
  });

  it("returns nothing for an empty buffer", () => {
    expect(parseRows(Buffer.from(""))).toEqual({ headers: [], rows: [] });
  });
});

describe("missingColumns", () => {
  it("lists required columns absent from the headers", () => {
    expect(missingColumns(["name", "salaryAmount"], COLUMNS)).toEqual(["email"]);
  });

  it("is empty when every required column is present", () => {
    expect(missingColumns(["name", "email", "salaryAmount", "extra"], COLUMNS)).toEqual([]);
  });
});

describe("toCsv", () => {
  it("writes the header row and orders columns as given", () => {
    const csv = toCsv([{ name: "Ada", email: "ada@acme.example", salaryAmount: 120000 }], COLUMNS);
    const [header, firstRow] = csv.trim().split("\n");

    expect(header).toBe("name,email,salaryAmount");
    expect(firstRow).toBe("Ada,ada@acme.example,120000");
  });
});
