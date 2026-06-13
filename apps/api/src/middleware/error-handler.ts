import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

/**
 * Central error handler — the single place that renders the shared error
 * envelope `{ error: { code, message, details? } }`. Express 5 forwards rejected
 * async handlers here automatically.
 *
 * - Typed `AppError`s map to their declared status + code (plan §2.1).
 * - A stray `ZodError` (validation not run through the middleware) → 400.
 * - Anything else is an unexpected 500; logged once here, with no internals leaked.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details === undefined ? {} : { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: err.issues },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
  });
}
