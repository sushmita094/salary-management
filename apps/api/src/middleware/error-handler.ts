import type { NextFunction, Request, Response } from "express";

/** Catch-all error handler. Express 5 forwards rejected async handlers here. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
