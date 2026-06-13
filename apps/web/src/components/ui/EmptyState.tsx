import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional next action (e.g. a "Clear filters" or "Import" button). */
  action?: ReactNode;
  className?: string;
}

/** Helpful empty/zero-result state with a clear next step (requirements §5.6). */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      <p className="text-base font-medium text-gray-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
