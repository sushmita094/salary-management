import { employeeQuerySchema, type EmployeeQuery } from "@acme/shared";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/** Keys that, when changed, should reset pagination back to page 1. */
type QueryPatch = Partial<Record<keyof EmployeeQuery, string | number | undefined>>;

/**
 * The directory's query state lives in the URL (so views are shareable and
 * back/forward works). This parses the URL into a typed `EmployeeQuery` via the
 * shared schema (defaults + coercion) and writes changes back. Any change other
 * than `page` resets to page 1, so new filters don't strand you on an empty page.
 */
export function useEmployeeQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo<EmployeeQuery>(() => {
    const parsed = employeeQuerySchema.safeParse(Object.fromEntries(searchParams));
    return parsed.success ? parsed.data : employeeQuerySchema.parse({});
  }, [searchParams]);

  const update = useCallback(
    (patch: QueryPatch) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          // Default page is 1; dropping the param resets there on any filter/sort change.
          if (!("page" in patch)) next.delete("page");
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  return { query, update };
}

/** True when any search/filter is active (drives the "Clear" affordance). */
export function hasActiveFilters(query: EmployeeQuery): boolean {
  return Boolean(query.search || query.country || query.department || query.jobTitle || query.level);
}
