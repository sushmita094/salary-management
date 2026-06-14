import type { Pagination as PaginationMeta } from "@acme/shared";
import { Button } from "./Button";
import { Select } from "./Select";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZES = [20, 50, 100];

/** Server-pagination controls reflecting the `{ page, pageSize, total, totalPages }` meta. */
export function Pagination({ pagination, onPageChange, onPageSizeChange }: PaginationProps) {
  const { page, pageSize, total, totalPages } = pagination;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>{total.toLocaleString()} results</span>
        <Select
          className="w-32"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
