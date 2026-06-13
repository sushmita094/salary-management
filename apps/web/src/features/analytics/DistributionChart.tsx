import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { TBody, THead, Table, Td, Th, Tr } from "../../components/ui/Table";
import { formatMoney } from "../../lib/format";
import { useDistribution } from "./useAnalytics";

const BUCKET_OPTIONS = [5, 10, 15, 20];

interface DistributionChartProps {
  currency: string;
  bucketCount: number;
  onBucketCountChange: (bucketCount: number) => void;
}

/** Salary-band histogram for one currency, to surface spread and outliers. */
export function DistributionChart({ currency, bucketCount, onBucketCountChange }: DistributionChartProps) {
  const { data, isPending, isError } = useDistribution({ currency, bucketCount });

  const entry = data?.currencies.find((item) => item.currency === currency);
  const bands = entry?.bands ?? [];
  const chartData = bands.map((band, index) => ({ band: `${index + 1}`, count: band.count }));

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Pay distribution · {currency}</h3>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Bands
          <Select
            className="w-20"
            value={bucketCount}
            onChange={(event) => onBucketCountChange(Number(event.target.value))}
            aria-label="Number of bands"
          >
            {BUCKET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {isPending ? (
        <Skeleton className="h-72 w-full" />
      ) : isError ? (
        <EmptyState title="Couldn’t load distribution" />
      ) : bands.length === 0 ? (
        <EmptyState title="No data for this currency" />
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Employees" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <THead>
              <Tr>
                <Th>Band</Th>
                <Th>Range</Th>
                <Th className="text-right">Employees</Th>
              </Tr>
            </THead>
            <TBody>
              {bands.map((band, index) => (
                <Tr key={index}>
                  <Td>{index + 1}</Td>
                  <Td className="tabular-nums">
                    {formatMoney(band.from, currency)} – {formatMoney(band.to, currency)}
                  </Td>
                  <Td className="text-right tabular-nums">{band.count.toLocaleString()}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </Card>
  );
}
