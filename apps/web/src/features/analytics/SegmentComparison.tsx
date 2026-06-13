import type { AnalyticsDimension } from "@acme/shared";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { TBody, THead, Table, Td, Th, Tr } from "../../components/ui/Table";
import { formatMoney } from "../../lib/format";
import { useByDimension } from "./useAnalytics";

interface SegmentComparisonProps {
  dimension: AnalyticsDimension;
  currency: string;
}

/** Side-by-side average vs **median** per segment (chart + backing table), for one currency. */
export function SegmentComparison({ dimension, currency }: SegmentComparisonProps) {
  const { data, isPending, isError } = useByDimension(dimension);

  if (isPending) return <Skeleton className="h-80 w-full" />;
  if (isError) {
    return (
      <Card className="p-6">
        <EmptyState title="Couldn’t load segment comparison" />
      </Card>
    );
  }

  const groups = data.groups.filter((group) => group.currency === currency);
  if (groups.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState title="No data for this currency" description="Pick another currency above." />
      </Card>
    );
  }

  const chartData = groups.map((group) => ({
    value: group.value,
    average: Math.round(group.average),
    median: Math.round(group.median),
  }));

  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-sm font-medium text-gray-900">
        Average vs median by {dimension} · {currency}
      </h3>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="value" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} width={80} tickFormatter={(value: number) => formatMoney(value, currency)} />
            <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
            <Legend />
            <Bar dataKey="average" name="Average" fill="#6366f1" />
            <Bar dataKey="median" name="Median" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table>
        <THead>
          <Tr>
            <Th>{dimension}</Th>
            <Th className="text-right">Headcount</Th>
            <Th className="text-right">Average</Th>
            <Th className="text-right">Median</Th>
            <Th className="text-right">Min</Th>
            <Th className="text-right">Max</Th>
          </Tr>
        </THead>
        <TBody>
          {groups.map((group) => (
            <Tr key={group.value}>
              <Td className="font-medium text-gray-900">{group.value}</Td>
              <Td className="text-right tabular-nums">{group.headcount.toLocaleString()}</Td>
              <Td className="text-right tabular-nums">{formatMoney(group.average, currency)}</Td>
              <Td className="text-right font-semibold tabular-nums text-brand-700">{formatMoney(group.median, currency)}</Td>
              <Td className="text-right tabular-nums">{formatMoney(group.min, currency)}</Td>
              <Td className="text-right tabular-nums">{formatMoney(group.max, currency)}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
