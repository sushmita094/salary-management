import { z } from "zod";

/**
 * Compensation analytics contracts (requirements §5.3). Because salaries are in
 * local currencies and FX is out of scope, every monetary rollup is reported
 * **per currency** — the response always names the currency so the UI can never
 * imply a false cross-currency total.
 */

/** Segments the org can be sliced by for side-by-side comparison. */
export const ANALYTICS_DIMENSIONS = ["department", "country", "jobTitle", "level"] as const;

/** Path param for `GET /analytics/by/:dimension`. */
export const analyticsDimensionParamsSchema = z.object({
  dimension: z.enum(ANALYTICS_DIMENSIONS),
});

/** Bounds on the histogram resolution for the distribution endpoint. */
export const MIN_BUCKETS = 2;
export const MAX_BUCKETS = 50;
export const DEFAULT_BUCKETS = 10;

/** Query for `GET /analytics/distribution` — optional scoping + histogram resolution. */
export const distributionQuerySchema = z.object({
  currency: z.string().length(3).optional(),
  country: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().min(1).optional(),
  level: z.string().trim().min(1).optional(),
  bucketCount: z.coerce.number().int().min(MIN_BUCKETS).max(MAX_BUCKETS).default(DEFAULT_BUCKETS),
});

// ── Response shapes ────────────────────────────────────────────────────────

/** Org-wide rollup for a single currency. */
export const currencyRollupSchema = z.object({
  currency: z.string(),
  headcount: z.number().int(),
  totalSpend: z.number(),
  average: z.number(),
  median: z.number(),
});

/** `GET /analytics/summary` — headcount overall, money rolled up per currency. */
export const analyticsSummarySchema = z.object({
  headcount: z.number().int(),
  byCurrency: z.array(currencyRollupSchema),
});

/** Stats for one (segment value × currency) cell. */
export const segmentStatSchema = z.object({
  value: z.string(),
  currency: z.string(),
  headcount: z.number().int(),
  average: z.number(),
  median: z.number(),
  min: z.number(),
  max: z.number(),
});

/** `GET /analytics/by/:dimension` — per-segment stats (avg + median + min/max). */
export const analyticsByDimensionSchema = z.object({
  dimension: z.enum(ANALYTICS_DIMENSIONS),
  groups: z.array(segmentStatSchema),
});

/** A single histogram band: `[from, to)` (the final band is inclusive of `to`). */
export const distributionBandSchema = z.object({
  from: z.number(),
  to: z.number(),
  count: z.number().int(),
});

/** Equal-width histogram for one currency, between that currency's min and max. */
export const currencyDistributionSchema = z.object({
  currency: z.string(),
  min: z.number(),
  max: z.number(),
  bands: z.array(distributionBandSchema),
});

/** `GET /analytics/distribution` — pay bands per currency. */
export const analyticsDistributionSchema = z.object({
  bucketCount: z.number().int(),
  currencies: z.array(currencyDistributionSchema),
});
