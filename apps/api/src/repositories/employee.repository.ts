import type { Employee } from "@acme/shared";
import { prisma } from "../db/client.js";

/**
 * Data access for employees. Proves the api ↔ @acme/shared ↔ Prisma wiring:
 * the Prisma row shape aligns with the shared Employee type.
 *
 * Pagination, filtering, sorting, and the raw-SQL median/aggregate queries
 * land with the directory and analytics features.
 */
export function listEmployees(): Promise<Employee[]> {
  return prisma.employee.findMany();
}
