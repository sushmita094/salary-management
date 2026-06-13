import { EMPLOYEE_IMPORT_COLUMNS } from "@acme/shared";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ImportResultView } from "../features/importExport/ImportResultView";
import { useImport } from "../features/importExport/useImport";

/** Friendly message for an import failure — header mismatch lists the missing columns. */
function importErrorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return "Something went wrong. Please try again.";
  const details = error.details;
  if (details && typeof details === "object" && "missing" in details) {
    const missing = (details as { missing: string[] }).missing;
    return `${error.message}. Missing columns: ${missing.join(", ")}.`;
  }
  return error.message;
}

export function ImportExportPage() {
  const [file, setFile] = useState<File | null>(null);
  const importMutation = useImport();

  const onUpload = () => {
    if (file) importMutation.mutate(file);
  };

  return (
    <section className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Import / Export</h1>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-medium text-gray-900">Import from spreadsheet</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload a CSV or Excel file. Employees are matched (upserted) by email; bad rows are
            reported below and never applied — nothing silently corrupts your data.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Expected columns: <code className="rounded bg-gray-100 px-1">{EMPLOYEE_IMPORT_COLUMNS.join(", ")}</code>
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Spreadsheet file</span>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </label>

        <div>
          <Button onClick={onUpload} loading={importMutation.isPending} disabled={!file}>
            Upload
          </Button>
        </div>

        {importMutation.isError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {importErrorMessage(importMutation.error)}
          </p>
        )}

        {importMutation.data && <ImportResultView result={importMutation.data} />}
      </Card>

      <Card className="p-6 text-sm text-gray-600">
        <h2 className="text-base font-medium text-gray-900">Export</h2>
        <p className="mt-1">
          Export reflects the view you’re looking at. Use the <strong>Export</strong> control on the{" "}
          <Link to="/employees" className="text-brand-700 hover:underline">
            Directory
          </Link>{" "}
          to download the current filtered list as CSV or Excel.
        </p>
      </Card>
    </section>
  );
}
