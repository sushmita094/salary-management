import type { EmployeeQuery } from "@acme/shared";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { buttonClasses } from "../components/ui/button-styles";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Pagination } from "../components/ui/Pagination";
import { EmployeeTable } from "../features/employees/EmployeeTable";
import { FilterBar } from "../features/employees/FilterBar";
import { hasActiveFilters, useEmployeeQuery } from "../features/employees/useEmployeeQuery";
import { ExportButton } from "../features/importExport/ExportButton";
import { useEmployees } from "../features/employees/useEmployees";

/** Employee directory — paginated, searchable, filterable, sortable; state in the URL. */
export function DirectoryPage() {
  const { query, update } = useEmployeeQuery();
  const { data, isPending, isError, isFetching, refetch } = useEmployees(query);

  const onSort = (field: EmployeeQuery["sort"]) => {
    const order = query.sort === field && query.order === "asc" ? "desc" : "asc";
    update({ sort: field, order });
  };

  const clearFilters = () =>
    update({ search: undefined, country: undefined, department: undefined, jobTitle: undefined, level: undefined });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Directory</h1>
        <div className="flex items-center gap-3">
          <ExportButton query={query} />
          <Link to="/employees/new" className={buttonClasses()}>
            New employee
          </Link>
        </div>
      </div>

      <FilterBar query={query} update={update} />

      {isError ? (
        <ErrorState
          title="Couldn’t load employees"
          description="Something went wrong fetching the directory."
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : !isPending && data && data.data.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No employees match"
            description={hasActiveFilters(query) ? "Try changing or clearing the filters." : "Import a spreadsheet to get started."}
            action={
              hasActiveFilters(query) ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div aria-busy={isFetching} className={isFetching ? "opacity-60 transition-opacity" : undefined}>
          <EmployeeTable rows={data?.data ?? []} query={query} onSort={onSort} isLoading={isPending} />
          {data && (
            <Pagination
              pagination={data.pagination}
              onPageChange={(page) => update({ page })}
              onPageSizeChange={(pageSize) => update({ pageSize, page: 1 })}
            />
          )}
        </div>
      )}
    </section>
  );
}
