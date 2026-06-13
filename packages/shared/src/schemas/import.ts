import { z } from "zod";
import { employeeQuerySchema } from "./query.js";

/**
 * Bulk import/export contracts (requirements §5.4).
 *
 * The spreadsheet column headers are exactly the employee field names, in this
 * order — the same headers the export writes, so an export round-trips back
 * through import unchanged.
 */
export const EMPLOYEE_IMPORT_COLUMNS = [
  "name",
  "email",
  "country",
  "department",
  "jobTitle",
  "level",
  "salaryAmount",
  "salaryCurrency",
] as const;

/**
 * One parsed import row. Values arrive as strings (CSV) or numbers (Excel), so
 * `salaryAmount` is coerced and text is trimmed. Email is the natural upsert key.
 * Shape matches `CreateEmployee`, so a valid row is ready to persist.
 */
export const importRowSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  country: z.string().trim().min(1),
  department: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1),
  level: z.string().trim().min(1),
  salaryAmount: z.coerce.number().nonnegative(),
  salaryCurrency: z.string().trim().length(3),
});

/** A single rejected row, reported back so the upload is never silently corrupting. */
export const importRowErrorSchema = z.object({
  /** 1-based spreadsheet row number (the header is row 1, so data starts at row 2). */
  row: z.number().int(),
  errors: z.array(z.string()),
});

/** `POST /import` summary: counts plus the per-row errors for the bad rows. */
export const importResultSchema = z.object({
  inserted: z.number().int(),
  updated: z.number().int(),
  failed: z.number().int(),
  rowErrors: z.array(importRowErrorSchema),
});

/** Output formats the export can produce. */
export const EXPORT_FORMATS = ["csv", "xlsx"] as const;

/**
 * `GET /export` query — the directory's filters and sort (so the export reflects
 * exactly the filtered view), minus pagination (the export is the whole match),
 * plus the desired file format.
 */
export const exportQuerySchema = employeeQuerySchema
  .omit({ page: true, pageSize: true })
  .extend({ format: z.enum(EXPORT_FORMATS).default("csv") });
