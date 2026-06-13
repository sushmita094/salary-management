import type { AuthUser, LoginInput, LoginResponse } from "@acme/shared";
import { api } from "./client";

/**
 * Bootstrap the session from the httpOnly cookie. A 401 here just means "not
 * signed in", so it skips the global redirect handler (the guard handles routing).
 */
export function fetchMe(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me", { skipUnauthorizedHandler: true });
}

/** Sign in. A 401 (bad credentials) is shown inline, so it skips the redirect handler. */
export function login(input: LoginInput): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", input, { skipUnauthorizedHandler: true });
}

/** Sign out — clears the session cookie server-side. */
export function logout(): Promise<void> {
  return api.post<void>("/auth/logout");
}
