import type { z } from "zod";
import type {
  analyticsByDimensionSchema,
  analyticsDistributionSchema,
  analyticsSummarySchema,
  ANALYTICS_DIMENSIONS,
  currencyDistributionSchema,
  currencyRollupSchema,
  distributionBandSchema,
  distributionQuerySchema,
  segmentStatSchema,
} from "../schemas/analytics.js";

/** A segment the org can be sliced by (`department` | `country` | `jobTitle` | `level`). */
export type AnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number];

/** Parsed query for the distribution endpoint. */
export type DistributionQuery = z.infer<typeof distributionQuerySchema>;

/** Org-wide money rollup for one currency. */
export type CurrencyRollup = z.infer<typeof currencyRollupSchema>;

/** `GET /analytics/summary` response. */
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;

/** Stats for one (segment value × currency) cell. */
export type SegmentStat = z.infer<typeof segmentStatSchema>;

/** `GET /analytics/by/:dimension` response. */
export type AnalyticsByDimension = z.infer<typeof analyticsByDimensionSchema>;

/** One histogram band. */
export type DistributionBand = z.infer<typeof distributionBandSchema>;

/** A currency's full histogram. */
export type CurrencyDistribution = z.infer<typeof currencyDistributionSchema>;

/** `GET /analytics/distribution` response. */
export type AnalyticsDistribution = z.infer<typeof analyticsDistributionSchema>;
