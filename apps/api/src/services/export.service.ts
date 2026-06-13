import type { ExportQuery } from "@acme/shared";
import { EMPLOYEE_IMPORT_COLUMNS } from "@acme/shared";
import { findEmployeesForExport } from "../repositories/employee.repository.js";
import { toCsv, toXlsx } from "../utils/spreadsheet.js";

export interface ExportFile {
  body: string | Buffer;
  contentType: string;
  filename: string;
}

/**
 * Build the export file for the active filter/sort. Columns (and their order)
 * match the import format exactly, so a downloaded file can be re-uploaded
 * unchanged. Money stays in each row's local currency — no FX.
 */
export async function buildExport(query: ExportQuery): Promise<ExportFile> {
  const employees = await findEmployeesForExport(query);

  // Restrict to the canonical columns (drops id/timestamps) so import round-trips.
  const records = employees.map((e) => ({
    name: e.name,
    email: e.email,
    country: e.country,
    department: e.department,
    jobTitle: e.jobTitle,
    level: e.level,
    salaryAmount: e.salaryAmount,
    salaryCurrency: e.salaryCurrency,
  }));

  const stamp = new Date().toISOString().slice(0, 10);

  if (query.format === "xlsx") {
    return {
      body: toXlsx(records, EMPLOYEE_IMPORT_COLUMNS),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `employees-${stamp}.xlsx`,
    };
  }

  return {
    body: toCsv(records, EMPLOYEE_IMPORT_COLUMNS),
    contentType: "text/csv; charset=utf-8",
    filename: `employees-${stamp}.csv`,
  };
}
