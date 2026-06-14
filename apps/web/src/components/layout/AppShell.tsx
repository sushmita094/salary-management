import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { PageSpinner } from "../ui/PageSpinner";
import { Suspense } from "react";

const NAV = [
  { to: "/employees", label: "Directory" },
  { to: "/analytics", label: "Analytics" },
  { to: "/import-export", label: "Import / Export" },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

/**
 * Persistent app shell: brand + primary nav header wrapping the routed page in an
 * `<Outlet/>`. Responsive — the nav drops to its own full-width row on narrow
 * screens. The login route renders outside this shell.
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
          <NavLink to="/employees" className={cn("rounded text-sm font-semibold text-gray-900", focusRing)}>
            ACME Salary Management
          </NavLink>

          <nav
            aria-label="Primary"
            className="order-last w-full overflow-x-auto sm:order-0 sm:w-auto sm:overflow-visible"
          >
            <div className="flex items-center gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                      focusRing,
                      isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user && <span className="hidden text-sm text-gray-500 sm:inline">{user.email}</span>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 focus:outline-none">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
