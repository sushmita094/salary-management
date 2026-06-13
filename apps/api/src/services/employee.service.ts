import type { EmployeeQuery, Paginated } from "@acme/shared";
import { countEmployees, findEmployees } from "../repositories/employee.repository.js";

type EmployeeRow = Awaited<ReturnType<typeof findEmployees>>[number];

/**
 * Directory listing: returns the standard `{ data, pagination }` envelope.
 *
 * We count the filtered total first, derive `totalPages`, then clamp the
 * requested page into range — so asking for a page past the end returns the last
 * page rather than an empty slice, and the reported `page` always matches the
 * data. Rows carry `Date` timestamps; `res.json` serialises them to the ISO
 * strings the wire `Employee` type declares.
 */
export async function listEmployees(query: EmployeeQuery): Promise<Paginated<EmployeeRow>> {
  const total = await countEmployees(query);
  const totalPages = Math.ceil(total / query.pageSize);
  const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1;

  const data = await findEmployees({ ...query, page });

  return {
    data,
    pagination: { page, pageSize: query.pageSize, total, totalPages },
  };
}
