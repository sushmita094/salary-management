import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/** Styled native `<select>` — accessible by default; options are passed as children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
        "disabled:cursor-not-allowed disabled:bg-gray-50",
        invalid ? "border-red-500" : "border-gray-300",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
