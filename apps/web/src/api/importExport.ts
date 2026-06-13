import type { EmployeeQuery, ImportResult } from "@acme/shared";
import { api } from "./client";

export type ExportFormat = "csv" | "xlsx";

/** Upload a spreadsheet for import (multipart). Returns the per-row report. */
export function importFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return api.upload<ImportResult>("/import", formData);
}

/** Build the export path from the active directory filters/sort (pagination dropped) + format. */
export function buildExportPath(query: EmployeeQuery, format: ExportFormat): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || key === "pageSize") continue;
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  params.set("format", format);
  return `/export?${params.toString()}`;
}

/** Download the filtered export as a blob. */
export function downloadExport(query: EmployeeQuery, format: ExportFormat): Promise<Blob> {
  return api.download(buildExportPath(query, format));
}
