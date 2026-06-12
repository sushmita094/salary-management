interface StatusBadgeProps {
  label: string;
  ok: boolean;
}

/** Small presentational pill — no data fetching (reusable UI lives in components/). */
export function StatusBadge({ label, ok }: StatusBadgeProps) {
  const tone = ok ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
