import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Styled native `<select>` — accessible by default; options are passed as
 * children. The native arrow is replaced by a custom chevron so it sits with
 * consistent spacing from the edge (the browser arrow can't be positioned).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...props },
  ref,
) {
  return (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "block w-full appearance-none rounded-md border bg-white py-2 pl-3 pr-9 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
          "disabled:cursor-not-allowed disabled:bg-gray-50",
          invalid ? "border-red-500" : "border-gray-300",
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m6 8 4 4 4-4" />
      </svg>
    </div>
  );
});
