import type { CreateEmployee, Employee, EmployeeQuery, Paginated, UpdateEmployee } from "@acme/shared";
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

/** A single employee by id (404 → `ApiRequestError` with status 404). */
export function fetchEmployee(id: string): Promise<Employee> {
  return api.get<Employee>(`/employees/${id}`);
}

/** Create an employee (409 on duplicate email). */
export function createEmployee(body: CreateEmployee): Promise<Employee> {
  return api.post<Employee>("/employees", body);
}

/** Update an employee (404 if missing, 409 on email collision). */
export function updateEmployee(id: string, body: UpdateEmployee): Promise<Employee> {
  return api.put<Employee>(`/employees/${id}`, body);
}

/** Delete an employee (204; 404 if missing). */
export function deleteEmployee(id: string): Promise<void> {
  return api.delete<void>(`/employees/${id}`);
}
