import type { EmployeeQuery } from "@acme/shared";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { COUNTRY_OPTIONS, DEPARTMENT_OPTIONS, LEVEL_OPTIONS } from "./filterOptions";
import { hasActiveFilters } from "./useEmployeeQuery";

interface FilterBarProps {
  query: EmployeeQuery;
  update: (patch: Partial<Record<keyof EmployeeQuery, string | undefined>>) => void;
}

/** Debounced free-text search plus filter selects; every control writes to the URL. */
export function FilterBar({ query, update }: FilterBarProps) {
  const urlSearch = query.search ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);

  // Re-sync the input when the URL search changes externally (back/forward, Clear).
  // Render-phase adjustment per the React docs — no effect needed.
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  // Debounce typed search → URL; the equality check avoids resetting the page on mount.
  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== urlSearch) update({ search: search || undefined });
    }, 300);
    return () => clearTimeout(id);
  }, [search, urlSearch, update]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex-1 min-w-56">
        <span className="mb-1 block text-sm font-medium text-gray-700">Search</span>
        <Input
          type="search"
          placeholder="Name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <FilterSelect
        label="Country"
        value={query.country ?? ""}
        options={COUNTRY_OPTIONS}
        onChange={(value) => update({ country: value || undefined })}
      />
      <FilterSelect
        label="Department"
        value={query.department ?? ""}
        options={DEPARTMENT_OPTIONS}
        onChange={(value) => update({ department: value || undefined })}
      />
      <FilterSelect
        label="Level"
        value={query.level ?? ""}
        options={LEVEL_OPTIONS}
        onChange={(value) => update({ level: value || undefined })}
      />

      {hasActiveFilters(query) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            update({ search: undefined, country: undefined, department: undefined, jobTitle: undefined, level: undefined })
          }
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-40">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </label>
  );
}
