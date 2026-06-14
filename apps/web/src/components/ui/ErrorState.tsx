import type { ReactNode } from "react";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

/** Consistent error surface used across features: a card-wrapped empty state. */
export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-6">
      <EmptyState title={title} description={description} action={action} />
    </Card>
  );
}
