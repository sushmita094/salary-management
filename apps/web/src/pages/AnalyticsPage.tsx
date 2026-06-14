import { ANALYTICS_DIMENSIONS, type AnalyticsDimension } from "@acme/shared";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { DistributionChart } from "../features/analytics/DistributionChart";
import { SegmentComparison } from "../features/analytics/SegmentComparison";
import { SummaryCards } from "../features/analytics/SummaryCards";
import { useSummary } from "../features/analytics/useAnalytics";

const DIMENSION_LABELS: Record<AnalyticsDimension, string> = {
  department: "Department",
  country: "Country",
  jobTitle: "Job title",
  level: "Level",
};

export function AnalyticsPage() {
  const { data: summary, isPending, isError, refetch } = useSummary();
  const [dimension, setDimension] = useState<AnalyticsDimension>("department");
  const [currency, setCurrency] = useState<string | null>(null);
  const [bucketCount, setBucketCount] = useState(10);

  if (isPending) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </section>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn’t load analytics"
        action={
          <Button variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const currencies = summary.byCurrency.map((rollup) => rollup.currency);
  if (currencies.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState title="No analytics yet" description="Add or import employees to see compensation insights." />
      </Card>
    );
  }

  const activeCurrency = currency && currencies.includes(currency) ? currency : currencies[0]!;

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>

      <SummaryCards summary={summary} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-40">
          <span className="mb-1 block text-sm font-medium text-gray-700">Dimension</span>
          <Select value={dimension} onChange={(event) => setDimension(event.target.value as AnalyticsDimension)}>
            {ANALYTICS_DIMENSIONS.map((value) => (
              <option key={value} value={value}>
                {DIMENSION_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="min-w-40">
          <span className="mb-1 block text-sm font-medium text-gray-700">Currency</span>
          <Select value={activeCurrency} onChange={(event) => setCurrency(event.target.value)}>
            {currencies.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <SegmentComparison dimension={dimension} currency={activeCurrency} />
      <DistributionChart currency={activeCurrency} bucketCount={bucketCount} onBucketCountChange={setBucketCount} />
    </section>
  );
}
