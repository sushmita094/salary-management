import { describe, expect, it } from "vitest";
import { UnauthorizedError } from "../utils/errors.js";
import { hashPassword, issueToken, verifyPassword, verifyToken } from "./auth.service.js";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cret-pw");

    expect(hash).not.toBe("s3cret-pw"); // never stored in plaintext
    expect(await verifyPassword("s3cret-pw", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("JWT issue/verify", () => {
  const user = { id: "user-123", email: "hr@acme.example" };

  it("round-trips the user through a signed token", () => {
    expect(verifyToken(issueToken(user))).toEqual(user);
  });

  it("rejects a tampered or malformed token", () => {
    expect(() => verifyToken("not.a.jwt")).toThrow(UnauthorizedError);
  });
});
