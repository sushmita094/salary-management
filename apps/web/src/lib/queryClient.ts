import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient. Sensible defaults for a data dashboard: a short stale time
 * (data is fresh enough for a few seconds without refetch storms), a single retry,
 * and no refetch-on-focus (the HR Manager tabs around without wanting churn).
 * Lists add `placeholderData: keepPreviousData` per-query so paging doesn't flash.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
