import type { ImportResult, ImportRow, ImportRowError } from "@acme/shared";
import { EMPLOYEE_IMPORT_COLUMNS, importRowSchema } from "@acme/shared";
import { upsertEmployeesByEmail } from "../repositories/employee.repository.js";
import { ValidationError } from "../utils/errors.js";
import { missingColumns, parseRows } from "../utils/spreadsheet.js";

/**
 * Parse an uploaded spreadsheet and apply it (requirements §5.4):
 *
 * - A header mismatch (missing required columns) is a whole-file error (400) —
 *   we don't guess column positions.
 * - Each data row is validated independently; bad rows are *reported, never
 *   fatal*, so a malformed file can't silently corrupt data.
 * - Valid rows are deduped by email (last occurrence wins) and upserted in one
 *   transaction. The response summarises inserted / updated / failed + per-row errors.
 */
export async function runImport(buffer: Buffer): Promise<ImportResult> {
  const { headers, rows } = parseRows(buffer);

  const missing = missingColumns(headers, EMPLOYEE_IMPORT_COLUMNS);
  if (missing.length > 0) {
    throw new ValidationError("Spreadsheet headers do not match the expected format", {
      expected: EMPLOYEE_IMPORT_COLUMNS,
      received: headers,
      missing,
    });
  }

  const rowErrors: ImportRowError[] = [];
  const valid = new Map<string, ImportRow>();

  rows.forEach((raw, index) => {
    const parsed = importRowSchema.safeParse(raw);
    if (parsed.success) {
      valid.set(parsed.data.email, parsed.data);
    } else {
      rowErrors.push({
        row: index + 2, // header is row 1, so the first data row is row 2
        errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
  });

  const { inserted, updated } = await upsertEmployeesByEmail([...valid.values()]);

  return { inserted, updated, failed: rowErrors.length, rowErrors };
}
