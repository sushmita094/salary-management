import { StatusBadge } from "./components/StatusBadge";
import { useHealth } from "./features/health/useHealth";
import { formatSalary } from "./lib/format";

export default function App() {
  const { data, isLoading, isError } = useHealth();
  const sampleSalary = formatSalary({ salaryAmount: 95000, salaryCurrency: "EUR" });

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">ACME Salary Management</h1>
      <p className="mt-2 text-gray-600">Monorepo scaffold — phase 4.</p>

      <div className="mt-4">
        {isLoading ? (
          <StatusBadge label="Checking API…" ok={false} />
        ) : isError ? (
          <StatusBadge label="API unreachable" ok={false} />
        ) : (
          <StatusBadge label={`API: ${data?.status ?? "unknown"}`} ok={data?.status === "ok"} />
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Sample formatted salary (shared types): {sampleSalary}
      </p>
    </main>
  );
}
