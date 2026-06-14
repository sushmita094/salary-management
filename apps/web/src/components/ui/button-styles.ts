import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600",
  secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:ring-brand-600",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-brand-600",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

/**
 * Button styling, also usable on a `<Link>` (so we render a real anchor for
 * navigation rather than nesting a button inside one).
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
