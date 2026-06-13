import type { Employee, EmployeeQuery, Paginated } from "@acme/shared";
import { api } from "./client";

/**
 * Fetch a page of employees. The query always carries `page`/`pageSize` (plus
 * sort and any filters), so the client never asks for the whole 10k table.
 */
export function fetchEmployees(query: EmployeeQuery): Promise<Paginated<Employee>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return api.get<Paginated<Employee>>(`/employees?${params.toString()}`);
}
