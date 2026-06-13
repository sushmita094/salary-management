import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

/** Catch-all 404 page. */
export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you’re looking for doesn’t exist."
      action={
        <Link to="/employees">
          <Button variant="secondary">Back to Directory</Button>
        </Link>
      }
    />
  );
}
