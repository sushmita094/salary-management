import type {
  AnalyticsByDimension,
  AnalyticsDimension,
  AnalyticsDistribution,
  AnalyticsSummary,
} from "@acme/shared";
import { api } from "./client";

/** Org-wide totals/avg/median per currency. */
export function fetchSummary(): Promise<AnalyticsSummary> {
  return api.get<AnalyticsSummary>("/analytics/summary");
}

/** Per-segment stats for a dimension (each row carries its currency). */
export function fetchByDimension(dimension: AnalyticsDimension): Promise<AnalyticsByDimension> {
  return api.get<AnalyticsByDimension>(`/analytics/by/${dimension}`);
}

/** Pay-band histogram, optionally scoped to a currency and resolution. */
export function fetchDistribution(params: { currency?: string; bucketCount?: number }): Promise<AnalyticsDistribution> {
  const search = new URLSearchParams();
  if (params.currency) search.set("currency", params.currency);
  if (params.bucketCount) search.set("bucketCount", String(params.bucketCount));
  return api.get<AnalyticsDistribution>(`/analytics/distribution?${search.toString()}`);
}
