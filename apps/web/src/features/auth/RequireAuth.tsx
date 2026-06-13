import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "./auth-context";

/**
 * Route guard for the app shell. While the session probe resolves it shows a
 * spinner; unauthenticated users are sent to /login with the intended
 * destination preserved, so they land where they meant to after signing in.
 */
export function RequireAuth() {
  const { user, isResolving } = useAuth();
  const location = useLocation();

  if (isResolving) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
