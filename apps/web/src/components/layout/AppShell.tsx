import { Suspense } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

const NAV = [
  { to: "/employees", label: "Directory" },
  { to: "/analytics", label: "Analytics" },
  { to: "/import-export", label: "Import / Export" },
];

/**
 * Persistent app shell: brand + primary nav header wrapping the routed page in an
 * `<Outlet/>`. The login route renders outside this shell. The signed-in user and
 * sign-out control are added with the auth layer (Phase 2).
 */
export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <NavLink to="/employees" className="text-sm font-semibold text-gray-900">
            ACME Salary Management
          </NavLink>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium",
                    isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user && <span className="text-sm text-gray-500">{user.email}</span>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6 text-brand-600" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
