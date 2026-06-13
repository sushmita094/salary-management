import type { CreateEmployee, UpdateEmployee } from "@acme/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEmployee, deleteEmployee, updateEmployee } from "../../api/employees";
import { keys } from "../../lib/queryKeys";

/**
 * After any write, every directory list page and all analytics become stale, so
 * we invalidate those key prefixes. Edits also refresh the affected detail.
 */
function useInvalidateEmployees() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: keys.employees.lists() });
    void queryClient.invalidateQueries({ queryKey: keys.analytics.all() });
    if (id) void queryClient.invalidateQueries({ queryKey: keys.employees.detail(id) });
  };
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (body: CreateEmployee) => createEmployee(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateEmployee(id: string) {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (body: UpdateEmployee) => updateEmployee(id, body),
    onSuccess: () => invalidate(id),
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => invalidate(),
  });
}
