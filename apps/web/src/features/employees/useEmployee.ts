import { useQuery } from "@tanstack/react-query";
import { fetchEmployee } from "../../api/employees";
import { keys } from "../../lib/queryKeys";

/** Detail query for one employee. `retry: false` so a 404 surfaces immediately. */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: keys.employees.detail(id),
    queryFn: () => fetchEmployee(id),
    retry: false,
  });
}
