import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

/** Compensation analytics dashboard — built in a later phase. */
export function AnalyticsPage() {
  return (
    <section>
      <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
      <Card className="mt-4">
        <EmptyState title="Analytics coming soon" description="Per-currency summary, segment comparisons and the distribution histogram arrive in a later phase." />
      </Card>
    </section>
  );
}
