import { cn } from "../../lib/cn";

/** A shimmering placeholder block for loading states (prefer over bare spinners). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-gray-200", className)} aria-hidden="true" />;
}
