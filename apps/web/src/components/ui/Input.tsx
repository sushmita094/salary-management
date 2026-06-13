import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Renders the error visual state (red border); the message is shown by the field wrapper. */
  invalid?: boolean;
}

/** Text input. `forwardRef` so React Hook Form can register it directly (later phases). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
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
    />
  );
});
