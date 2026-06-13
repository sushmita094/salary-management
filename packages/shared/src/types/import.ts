import type { z } from "zod";
import type {
  exportQuerySchema,
  importResultSchema,
  importRowErrorSchema,
  importRowSchema,
} from "../schemas/import.js";

/** A validated import row (same shape as `CreateEmployee`). */
export type ImportRow = z.infer<typeof importRowSchema>;

/** A single rejected row in the import report. */
export type ImportRowError = z.infer<typeof importRowErrorSchema>;

/** The `POST /import` response summary. */
export type ImportResult = z.infer<typeof importResultSchema>;

/** Parsed `GET /export` query (filters + sort + format). */
export type ExportQuery = z.infer<typeof exportQuerySchema>;
