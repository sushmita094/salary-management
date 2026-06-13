import type { z } from "zod";
import type {
  createEmployeeSchema,
  employeeSchema,
  updateEmployeeSchema,
} from "../schemas/employee.js";
import type { employeeQuerySchema } from "../schemas/query.js";
import type { employeeParamsSchema } from "../schemas/params.js";
import type { paginationSchema } from "../schemas/pagination.js";
import type { errorSchema } from "../schemas/error.js";

/** An employee record as stored and returned by the API. */
export type Employee = z.infer<typeof employeeSchema>;

/** Payload for creating a new employee (no id/timestamps yet). */
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;

/** Payload for updating an employee (any subset of the mutable fields). */
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;

/** Parsed, typed directory query (pagination + search/filter/sort). */
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;

/** Parsed path params for the single-employee routes (`{ id }`). */
export type EmployeeParams = z.infer<typeof employeeParamsSchema>;

/** Pagination metadata on every list response. */
export type Pagination = z.infer<typeof paginationSchema>;

/** The standard list envelope, generic over the item type. */
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

/** The standard error envelope. */
export type ApiError = z.infer<typeof errorSchema>;
