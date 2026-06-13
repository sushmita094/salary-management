import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/** A surface container — white card with a subtle border, for grouping content. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-gray-200 bg-white shadow-sm", className)} {...props} />;
}
