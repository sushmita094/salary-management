import type { Request, Response } from "express";
import type { AnalyticsDimension, DistributionQuery } from "@acme/shared";
import {
  getByDimension,
  getDistribution,
  getSummary,
} from "../services/analytics.service.js";

/**
 * Read-only compensation analytics. Inputs (the `:dimension` param, the
 * distribution query) were parsed by the `validate` middleware onto `res.locals`.
 * Every monetary figure the services return is currency-explicit.
 */

/** `GET /analytics/summary` — org-wide totals/avg/median, per currency. */
export async function getAnalyticsSummary(_req: Request, res: Response): Promise<void> {
  res.json(await getSummary());
}

/** `GET /analytics/by/:dimension` — per-segment avg/median/min/max. */
export async function getAnalyticsByDimension(_req: Request, res: Response): Promise<void> {
  const { dimension } = res.locals.params as { dimension: AnalyticsDimension };
  res.json(await getByDimension(dimension));
}

/** `GET /analytics/distribution` — pay bands per currency. */
export async function getAnalyticsDistribution(_req: Request, res: Response): Promise<void> {
  const query = res.locals.query as DistributionQuery;
  res.json(await getDistribution(query));
}
