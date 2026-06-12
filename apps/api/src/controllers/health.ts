import type { Request, Response } from "express";

/** Liveness probe — does not touch the database. */
export function getHealth(_req: Request, res: Response): void {
  res.json({ status: "ok" });
}
