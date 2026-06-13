import type { AnalyticsDimension } from "@acme/shared";
import { useQuery } from "@tanstack/react-query";
import { fetchByDimension, fetchDistribution, fetchSummary } from "../../api/analytics";
import { keys } from "../../lib/queryKeys";

export function useSummary() {
  return useQuery({ queryKey: keys.analytics.summary(), queryFn: fetchSummary });
}

export function useByDimension(dimension: AnalyticsDimension) {
  return useQuery({
    queryKey: keys.analytics.byDimension(dimension),
    queryFn: () => fetchByDimension(dimension),
  });
}

export function useDistribution(params: { currency?: string; bucketCount: number }) {
  return useQuery({
    queryKey: keys.analytics.distribution(params),
    queryFn: () => fetchDistribution(params),
    enabled: Boolean(params.currency),
  });
}
