import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

/** Bulk import / export surface — built in a later phase. */
export function ImportExportPage() {
  return (
    <section>
      <h1 className="text-xl font-semibold text-gray-900">Import / Export</h1>
      <Card className="mt-4">
        <EmptyState title="Import / Export coming soon" description="Upload a spreadsheet (with a per-row report) and export the filtered view in a later phase." />
      </Card>
    </section>
  );
}
