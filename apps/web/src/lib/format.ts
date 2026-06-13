import type { Employee } from "@acme/shared";

/** Formats an amount in a given ISO currency (the building block for all money display). */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a salary in its local currency. Uses the shared Employee type, proving
 * the one-definition-across-the-wire wiring (see docs/tech-stack.md §5).
 */
export function formatSalary(employee: Pick<Employee, "salaryAmount" | "salaryCurrency">): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: employee.salaryCurrency,
  }).format(employee.salaryAmount);
}
