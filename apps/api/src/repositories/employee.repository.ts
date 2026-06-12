import { prisma } from "../db/client.js";

/**
 * Data access for employees. Returns Prisma row shapes (with `Date` timestamps);
 * the wire `Employee` type in @acme/shared carries those as ISO strings, which is
 * exactly what `res.json` produces on the way out.
 *
 * Pagination, filtering, sorting, and the raw-SQL median/aggregate queries land
 * with the directory and analytics features (later phases).
 */
export function listEmployees() {
  return prisma.employee.findMany();
}
