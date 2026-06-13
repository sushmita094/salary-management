import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../utils/errors.js";

/**
 * Brute-force guard on sign-in: at most a handful of attempts per IP per window.
 * On limit, hand off to the central error handler so the response uses the shared
 * `{ error }` envelope (429) instead of the library's default body.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError("Too many login attempts — please try again later"));
  },
});
