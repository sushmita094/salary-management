import type { Request, Response } from "express";
import type { AuthUser, LoginInput } from "@acme/shared";
import { config } from "../config/env.js";
import { AUTH_COOKIE, login } from "../services/auth.service.js";

/** Cookie options for the session token (httpOnly so JS can't read it). */
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.isProduction,
};

/** `POST /auth/login` — verify credentials, set the session cookie, echo the token. */
export async function postLogin(_req: Request, res: Response): Promise<void> {
  const { email, password } = res.locals.body as LoginInput;
  const result = await login(email, password);

  res.cookie(AUTH_COOKIE, result.token, {
    ...cookieOptions,
    maxAge: config.jwtTtlSeconds * 1000,
  });
  res.json(result);
}

/** `POST /auth/logout` — clear the session cookie. */
export function postLogout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).send();
}

/** `GET /auth/me` — the current user (from the verified token), for session rehydrate. */
export function getMe(_req: Request, res: Response): void {
  res.json(res.locals.user as AuthUser);
}
