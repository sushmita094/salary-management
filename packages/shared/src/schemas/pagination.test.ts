import { describe, expect, it } from "vitest";
import { z } from "zod";
import { paginatedSchema } from "./pagination.js";

describe("paginatedSchema", () => {
  const schema = paginatedSchema(z.object({ id: z.number() }));

  it("accepts a well-formed envelope", () => {
    const value = {
      data: [{ id: 1 }, { id: 2 }],
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    };
    expect(schema.parse(value)).toEqual(value);
  });

  it("rejects items that don't match the inner schema", () => {
    expect(() =>
      schema.parse({
        data: [{ id: "nope" }],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    ).toThrow();
  });

  it("requires pagination metadata", () => {
    expect(() => schema.parse({ data: [] })).toThrow();
  });
});
