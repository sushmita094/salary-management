import type { EmployeeQuery } from "@acme/shared";
import { useState } from "react";
import { downloadExport, type ExportFormat } from "../../api/importExport";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/toast-context";
import { triggerDownload } from "../../lib/download";

/** Exports the current filtered view; the format select drives CSV vs XLSX. */
export function ExportButton({ query }: { query: EmployeeQuery }) {
  const { toast } = useToast();
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await downloadExport(query, format);
      const stamp = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `employees-${stamp}.${format}`);
    } catch {
      toast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        className="w-24"
        value={format}
        onChange={(event) => setFormat(event.target.value as ExportFormat)}
        aria-label="Export format"
      >
        <option value="csv">CSV</option>
        <option value="xlsx">Excel</option>
      </Select>
      <Button variant="secondary" onClick={onExport} loading={exporting}>
        Export
      </Button>
    </div>
  );
}
