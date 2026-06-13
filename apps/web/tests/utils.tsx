import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../src/app/router";
import { ToastProvider } from "../src/components/ui/Toast";
import { AuthProvider } from "../src/features/auth/AuthProvider";

/**
 * Render the full app (providers + router) at a given route, mirroring `App.tsx`
 * but with a `MemoryRouter` and a fresh, retry-free QueryClient per test.
 */
export function renderApp(route = "/"): RenderResult {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
