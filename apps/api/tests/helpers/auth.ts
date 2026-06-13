import type { Express } from "express";
import request from "supertest";
import { prisma } from "../../src/db/client.js";
import { hashPassword, issueToken } from "../../src/services/auth.service.js";

/** A stand-in signed-in user for gating tests (no DB row needed — the gate is stateless). */
export const TEST_USER = { id: "00000000-0000-4000-8000-0000000000aa", email: "hr@acme.example" };

/** Authorization header carrying a valid Bearer token for `TEST_USER`. */
export function authHeader(): { Authorization: string } {
  return { Authorization: `Bearer ${issueToken(TEST_USER)}` };
}

/** Insert a real user row (with a hashed password) for the login path. */
export async function seedUser(email: string, password: string) {
  return prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
}

/**
 * A Supertest entrypoint that pre-sets a valid Bearer token on every request, so
 * suites exercising the (now auth-gated) data routes stay focused on behaviour
 * rather than re-authenticating on each call.
 */
export function authedRequest(app: Express) {
  const headers = authHeader();
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string) => request(app).post(url).set(headers),
    put: (url: string) => request(app).put(url).set(headers),
    delete: (url: string) => request(app).delete(url).set(headers),
  };
}
