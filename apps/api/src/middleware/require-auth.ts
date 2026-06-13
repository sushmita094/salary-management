import type { Request, RequestHandler } from "express";
import { AUTH_COOKIE, verifyToken } from "../services/auth.service.js";
import { UnauthorizedError } from "../utils/errors.js";

/** Pull the JWT from the `Bearer` Authorization header, else the httpOnly cookie. */
function tokenFromRequest(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);

  const cookie: unknown = req.cookies?.[AUTH_COOKIE];
  return typeof cookie === "string" ? cookie : undefined;
}

/**
 * Gate for the data routes. Accepts the session token as a cookie *or* a Bearer
 * header (so Swagger's Authorize works against the httpOnly cookie), verifies it
 * statelessly, and stashes the user on `res.locals`. Missing/invalid → 401 via
 * the central error envelope.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token = tokenFromRequest(req);
  if (!token) {
    next(new UnauthorizedError("Authentication required"));
    return;
  }

  try {
    res.locals.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
