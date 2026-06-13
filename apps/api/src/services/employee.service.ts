import type { CreateEmployee, EmployeeQuery, Paginated, UpdateEmployee } from "@acme/shared";
import {
  countEmployees,
  createEmployee as insertEmployee,
  deleteEmployee as removeEmployee,
  findEmployeeById,
  findEmployees,
  updateEmployee as updateEmployeeRow,
} from "../repositories/employee.repository.js";
import { NotFoundError } from "../utils/errors.js";
import { mapWriteError } from "../utils/prisma-errors.js";

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

/** Fetch one employee, or raise a 404 if it doesn't exist. */
export async function getEmployee(id: string): Promise<EmployeeRow> {
  const employee = await findEmployeeById(id);
  if (!employee) throw new NotFoundError(`Employee ${id} not found`);
  return employee;
}

/** Create an employee; a duplicate email surfaces as a 409 (never a raw Prisma error). */
export async function createEmployee(data: CreateEmployee): Promise<EmployeeRow> {
  try {
    return await insertEmployee(data);
  } catch (err) {
    throw mapWriteError(err);
  }
}

/** Apply a partial update; 404 if the id is unknown, 409 on an email collision. */
export async function updateEmployee(id: string, data: UpdateEmployee): Promise<EmployeeRow> {
  try {
    return await updateEmployeeRow(id, data);
  } catch (err) {
    throw mapWriteError(err, id);
  }
}

/** Delete an employee; 404 if the id is unknown. */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    await removeEmployee(id);
  } catch (err) {
    throw mapWriteError(err, id);
  }
}
