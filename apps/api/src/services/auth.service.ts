import type { AuthUser, LoginResponse } from "@acme/shared";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { findUserByEmail } from "../repositories/user.repository.js";
import { UnauthorizedError } from "../utils/errors.js";

const BCRYPT_ROUNDS = 10;

/** Name of the httpOnly session cookie carrying the JWT. */
export const AUTH_COOKIE = "token";

/** Hash a plaintext password for storage (used by the seed). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Constant-time compare of a plaintext password against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Sign a stateless JWT carrying the user's id (`sub`) and email. */
export function issueToken(user: AuthUser): string {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: user.id,
    expiresIn: config.jwtTtlSeconds,
  });
}

/** Verify a JWT and return the user it represents, or throw `UnauthorizedError`. */
export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "string" || typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new UnauthorizedError("Invalid token");
    }
    return { id: payload.sub, email: payload.email };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Verify credentials and mint a session token. Returns the public user view plus
 * the token. A wrong email or password yields the same 401 — we don't reveal
 * which was wrong.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError("Invalid email or password");
  }
  const authUser: AuthUser = { id: user.id, email: user.email };
  return { user: authUser, token: issueToken(authUser) };
}
