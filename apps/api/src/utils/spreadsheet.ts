import * as XLSX from "xlsx";

/**
 * Thin SheetJS wrapper for the bulk import/export. SheetJS parses both Excel and
 * CSV (and writes both), so one library covers the round-trip. It buffers the
 * workbook rather than truly streaming — fine at the in-scope size (~10k rows);
 * see docs/tech-stack.md for the trade-off.
 */

export interface ParsedSheet {
  /** Trimmed header names from the first row. */
  headers: string[];
  /** Data rows as objects keyed by header. */
  rows: Array<Record<string, unknown>>;
}

/** Read the first worksheet of an uploaded buffer into headers + keyed rows. */
export function parseRows(buffer: Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) return { headers: [], rows: [] };

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const headers = (matrix[0] ?? []).map((cell) => String(cell).trim());
  const rows = matrix.slice(1).map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      record[header] = cells[i];
    });
    return record;
  });

  return { headers, rows };
}

/** Required columns absent from the uploaded headers — drives the header-mismatch error. */
export function missingColumns(headers: string[], required: readonly string[]): string[] {
  const present = new Set(headers);
  return required.filter((column) => !present.has(column));
}

/** Serialise records (already restricted to `columns`, in order) to CSV text. */
export function toCsv(records: Array<Record<string, unknown>>, columns: readonly string[]): string {
  const sheet = XLSX.utils.json_to_sheet(records, { header: [...columns] });
  return XLSX.utils.sheet_to_csv(sheet);
}

/** Serialise records to an `.xlsx` workbook buffer. */
export function toXlsx(records: Array<Record<string, unknown>>, columns: readonly string[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(records, { header: [...columns] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Employees");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
