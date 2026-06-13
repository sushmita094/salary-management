import type { CreateEmployee, EmployeeQuery, ImportRow, UpdateEmployee } from "@acme/shared";
import { prisma } from "../db/client.js";

/** The filter/sort subset of a query — shared by the directory list and the export. */
type EmployeeFilters = Pick<EmployeeQuery, "search" | "country" | "department" | "jobTitle" | "level">;
type EmployeeSort = Pick<EmployeeQuery, "sort" | "order">;

/**
 * Data access for employees. Returns Prisma row shapes (with `Date` timestamps);
 * the wire `Employee` type in @acme/shared carries those as ISO strings, which is
 * exactly what `res.json` produces on the way out.
 *
 * The directory list is a single parametrised Prisma query — `where` from
 * search+filters, `orderBy` from a whitelisted sort column, `skip`/`take` from
 * pagination. Every filter/sort column is indexed, so this stays responsive at
 * ~10k rows (plan §2.3). Raw-SQL median/aggregates land with analytics (Phase 5).
 */

// Derive the where/orderBy types straight from the generated client so the
// builders can't drift from the actual query API.
type FindManyArgs = NonNullable<Parameters<typeof prisma.employee.findMany>[0]>;
type EmployeeWhere = NonNullable<FindManyArgs["where"]>;
type EmployeeOrderBy = NonNullable<FindManyArgs["orderBy"]>;

/** Build the `where` clause from free-text search and the equality filters. */
export function buildWhere(query: EmployeeFilters): EmployeeWhere {
  const where: EmployeeWhere = {};

  if (query.search) {
    // SQLite `LIKE` (Prisma `contains`) is case-insensitive for ASCII, which is
    // what we want for a name/email lookup.
    where.OR = [
      { name: { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }
  if (query.country) where.country = query.country;
  if (query.department) where.department = query.department;
  if (query.jobTitle) where.jobTitle = query.jobTitle;
  if (query.level) where.level = query.level;

  return where;
}

/**
 * Order by the (whitelisted) sort column, then by `id` as a stable tiebreak so
 * pages don't shuffle rows that share a sort value (e.g. equal salaries).
 */
export function buildOrderBy(query: EmployeeSort): EmployeeOrderBy {
  return [{ [query.sort]: query.order }, { id: "asc" }] as EmployeeOrderBy;
}

/** Page of employees matching the query (offset pagination). */
export function findEmployees(query: EmployeeQuery) {
  return prisma.employee.findMany({
    where: buildWhere(query),
    orderBy: buildOrderBy(query),
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
}

/** Total rows matching the query's filters (search/filter, ignoring pagination). */
export function countEmployees(query: EmployeeQuery): Promise<number> {
  return prisma.employee.count({ where: buildWhere(query) });
}

/** A single employee by id, or `null` if none exists. */
export function findEmployeeById(id: string) {
  return prisma.employee.findUnique({ where: { id } });
}

/** Insert a new employee. Throws Prisma `P2002` on a duplicate email. */
export function createEmployee(data: CreateEmployee) {
  return prisma.employee.create({ data });
}

/**
 * Update an existing employee with the provided (partial) fields. Throws Prisma
 * `P2025` if the id doesn't exist and `P2002` on an email collision.
 */
export function updateEmployee(id: string, data: UpdateEmployee) {
  return prisma.employee.update({ where: { id }, data });
}

/** Delete an employee by id. Throws Prisma `P2025` if it doesn't exist. */
export function deleteEmployee(id: string) {
  return prisma.employee.delete({ where: { id } });
}

/**
 * Every employee matching the filters/sort, unpaginated — backs the export, so
 * the downloaded file reflects exactly the filtered directory view.
 */
export function findEmployeesForExport(query: EmployeeFilters & EmployeeSort) {
  return prisma.employee.findMany({
    where: buildWhere(query),
    orderBy: buildOrderBy(query),
  });
}

/**
 * Upsert import rows by email inside a single transaction: existing emails are
 * updated, the rest inserted in one `createMany`. Atomic — a mid-batch failure
 * rolls the whole import back, so a bad file never half-applies.
 */
export async function upsertEmployeesByEmail(
  rows: ImportRow[],
): Promise<{ inserted: number; updated: number }> {
  if (rows.length === 0) return { inserted: 0, updated: 0 };

  return prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findMany({
      where: { email: { in: rows.map((row) => row.email) } },
      select: { email: true },
    });
    const existingEmails = new Set(existing.map((e) => e.email));

    const toInsert = rows.filter((row) => !existingEmails.has(row.email));
    const toUpdate = rows.filter((row) => existingEmails.has(row.email));

    if (toInsert.length > 0) await tx.employee.createMany({ data: toInsert });
    for (const row of toUpdate) {
      await tx.employee.update({ where: { email: row.email }, data: row });
    }

    return { inserted: toInsert.length, updated: toUpdate.length };
  });
}
