import type { AnalyticsSummary } from "@acme/shared";
import { Card } from "../../components/ui/Card";
import { formatMoney } from "../../lib/format";

/**
 * Headcount + a card per currency (total spend, average, median). Money is always
 * shown in its own currency and **never summed across currencies** (FX is out of
 * scope), so there is no combined-total figure here by design.
 */
export function SummaryCards({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="p-4">
        <p className="text-sm text-gray-500">Total headcount</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.headcount.toLocaleString()}</p>
      </Card>

      {summary.byCurrency.map((rollup) => (
        <Card key={rollup.currency} className="p-4" aria-label={`${rollup.currency} summary`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{rollup.currency}</p>
            <span className="text-xs text-gray-500">{rollup.headcount.toLocaleString()} people</span>
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Total spend" value={formatMoney(rollup.totalSpend, rollup.currency)} />
            <Row label="Average" value={formatMoney(rollup.average, rollup.currency)} />
            <Row label="Median" value={formatMoney(rollup.median, rollup.currency)} emphasis />
          </dl>
        </Card>
      ))}
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={emphasis ? "font-semibold text-brand-700" : "font-medium text-gray-900"}>{value}</dd>
    </div>
  );
}
