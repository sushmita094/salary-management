import { z } from "zod";

/**
 * Columns the directory may sort by. Whitelisted (not free-form) so a sort param
 * can never reach Prisma as an arbitrary column — every value here is an indexed
 * Employee field, keeping the list responsive at ~10k rows.
 */
export const EMPLOYEE_SORT_FIELDS = [
  "name",
  "email",
  "country",
  "department",
  "jobTitle",
  "level",
  "salaryAmount",
  "createdAt",
] as const;

/** Bounds on page size so a caller can't request the whole table in one page. */
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Query parameters for `GET /employees` (and the filtered export). Values arrive
 * as strings on the URL, so numeric fields are coerced and defaulted; defaults
 * apply when the param is absent, before coercion.
 */
export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  /** Free-text match against name/email. */
  search: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().min(1).optional(),
  level: z.string().trim().min(1).optional(),
  sort: z.enum(EMPLOYEE_SORT_FIELDS).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
