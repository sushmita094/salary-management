import { describe, expect, it } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { ConflictError, NotFoundError } from "./errors.js";
import { mapWriteError } from "./prisma-errors.js";

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("db error", { code, clientVersion: "7.8.0" });
}

describe("mapWriteError", () => {
  it("maps a unique-constraint violation (P2002) to a 409 ConflictError", () => {
    const mapped = mapWriteError(prismaError("P2002"));
    expect(mapped).toBeInstanceOf(ConflictError);
    expect((mapped as ConflictError).status).toBe(409);
  });

  it("maps a record-not-found (P2025) to a 404 NotFoundError carrying the id", () => {
    const mapped = mapWriteError(prismaError("P2025"), "emp-123");
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect((mapped as NotFoundError).message).toContain("emp-123");
  });

  it("passes through an unrecognised Prisma code untouched", () => {
    const original = prismaError("P2003");
    expect(mapWriteError(original)).toBe(original);
  });

  it("passes through a non-Prisma error untouched", () => {
    const original = new Error("boom");
    expect(mapWriteError(original)).toBe(original);
  });
});
