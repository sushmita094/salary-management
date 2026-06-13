import { http, HttpResponse } from "msw";

/** A signed-in user fixture for tests. */
export const TEST_USER = { id: "user-1", email: "hr@acme.example" };

const unauthorized = () =>
  HttpResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

/** Authenticated `GET /auth/me` — used via `server.use(...)` in tests that need a session. */
export const authenticatedMe = () => http.get("/api/auth/me", () => HttpResponse.json(TEST_USER));

/**
 * Default handlers: unauthenticated session, a successful login, and logout.
 * Individual tests override these with `server.use(...)`.
 */
export const handlers = [
  http.get("/api/auth/me", unauthorized),
  http.post("/api/auth/login", () => HttpResponse.json({ user: TEST_USER, token: "test-token" })),
  http.post("/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
];
