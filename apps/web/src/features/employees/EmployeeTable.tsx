import type { Employee, EmployeeQuery } from "@acme/shared";
import { Link } from "react-router-dom";
import { Skeleton } from "../../components/ui/Skeleton";
import { TBody, THead, Table, Td, Th, Tr } from "../../components/ui/Table";
import { formatSalary } from "../../lib/format";

type SortField = EmployeeQuery["sort"];

interface Column {
  field: SortField;
  label: string;
  align?: "right";
}

const COLUMNS: Column[] = [
  { field: "name", label: "Name" },
  { field: "email", label: "Email" },
  { field: "country", label: "Country" },
  { field: "department", label: "Department" },
  { field: "level", label: "Level" },
  { field: "salaryAmount", label: "Salary", align: "right" },
];

interface EmployeeTableProps {
  rows: Employee[];
  query: EmployeeQuery;
  onSort: (field: SortField) => void;
  isLoading: boolean;
}

/** The directory table: sortable headers, local-currency salary, rows link to detail. */
export function EmployeeTable({ rows, query, onSort, isLoading }: EmployeeTableProps) {
  return (
    <Table>
      <THead>
        <Tr>
          {COLUMNS.map((column) => (
            <SortableHeader
              key={column.field}
              column={column}
              active={query.sort === column.field}
              order={query.order}
              onSort={onSort}
            />
          ))}
        </Tr>
      </THead>
      <TBody>
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Tr key={index}>
                {COLUMNS.map((column) => (
                  <Td key={column.field}>
                    <Skeleton className="h-4 w-24" />
                  </Td>
                ))}
              </Tr>
            ))
          : rows.map((employee) => (
              <Tr key={employee.id} className="hover:bg-gray-50">
                <Td className="font-medium text-gray-900">
                  <Link to={`/employees/${employee.id}`} className="text-brand-700 hover:underline">
                    {employee.name}
                  </Link>
                </Td>
                <Td>{employee.email}</Td>
                <Td>{employee.country}</Td>
                <Td>{employee.department}</Td>
                <Td>{employee.level}</Td>
                <Td className="text-right tabular-nums">{formatSalary(employee)}</Td>
              </Tr>
            ))}
      </TBody>
    </Table>
  );
}

function SortableHeader({
  column,
  active,
  order,
  onSort,
}: {
  column: Column;
  active: boolean;
  order: EmployeeQuery["order"];
  onSort: (field: SortField) => void;
}) {
  const indicator = active ? (order === "asc" ? "↑" : "↓") : "";
  return (
    <Th aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"} className={column.align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(column.field)}
        className="inline-flex items-center gap-1 font-medium uppercase tracking-wide hover:text-gray-900"
      >
        {column.label}
        {indicator && <span aria-hidden="true">{indicator}</span>}
      </button>
    </Th>
  );
}
