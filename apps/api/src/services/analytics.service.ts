import type {
  AnalyticsByDimension,
  AnalyticsDimension,
  AnalyticsDistribution,
  AnalyticsSummary,
  DistributionQuery,
} from "@acme/shared";
import {
  distributionBuckets,
  segmentStats,
  summaryByCurrency,
} from "../repositories/analytics.repository.js";
import { buildBands } from "../utils/distribution.js";

/** Org-wide summary: headcount overall, money rolled up per currency. */
export async function getSummary(): Promise<AnalyticsSummary> {
  const byCurrency = await summaryByCurrency();
  const headcount = byCurrency.reduce((sum, c) => sum + c.headcount, 0);
  return { headcount, byCurrency };
}

/** Per-segment stats for one dimension (avg + median + min/max, per currency). */
export async function getByDimension(dimension: AnalyticsDimension): Promise<AnalyticsByDimension> {
  const groups = await segmentStats(dimension);
  return { dimension, groups };
}

/** Pay-band histogram per currency, reconstructed from the SQL bucket counts. */
export async function getDistribution(query: DistributionQuery): Promise<AnalyticsDistribution> {
  const rows = await distributionBuckets(query, query.bucketCount);

  // Rows arrive ordered by currency, so a Map preserves currency order for the response.
  const perCurrency = new Map<string, { min: number; max: number; counts: Map<number, number> }>();
  for (const row of rows) {
    let entry = perCurrency.get(row.currency);
    if (!entry) {
      entry = { min: row.lo, max: row.hi, counts: new Map() };
      perCurrency.set(row.currency, entry);
    }
    entry.counts.set(row.bucket, row.count);
  }

  const currencies = [...perCurrency].map(([currency, { min, max, counts }]) => ({
    currency,
    min,
    max,
    bands: buildBands(min, max, query.bucketCount, counts),
  }));

  return { bucketCount: query.bucketCount, currencies };
}
