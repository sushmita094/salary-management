import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

/** Employee directory — the searchable, paginated table lands in Phase 3. */
export function DirectoryPage() {
  return (
    <section>
      <h1 className="text-xl font-semibold text-gray-900">Directory</h1>
      <Card className="mt-4">
        <EmptyState title="Directory coming soon" description="The employee table, search, filters and pagination arrive in a later phase." />
      </Card>
    </section>
  );
}
