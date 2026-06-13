import type { EmployeeQuery } from "@acme/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "../../api/employees";
import { keys } from "../../lib/queryKeys";

/**
 * The directory list query. `keepPreviousData` holds the current page on screen
 * while the next one loads, so paging/filtering doesn't flash empty.
 */
export function useEmployees(query: EmployeeQuery) {
  return useQuery({
    queryKey: keys.employees.list(query),
    queryFn: () => fetchEmployees(query),
    placeholderData: keepPreviousData,
  });
}
