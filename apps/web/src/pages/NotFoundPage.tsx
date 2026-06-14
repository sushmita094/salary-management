import { Link } from "react-router-dom";
import { buttonClasses } from "../components/ui/button-styles";
import { EmptyState } from "../components/ui/EmptyState";

/** Catch-all 404 page. */
export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you’re looking for doesn’t exist."
      action={
        <Link to="/employees" className={buttonClasses("secondary")}>
          Back to Directory
        </Link>
      }
    />
  );
}
