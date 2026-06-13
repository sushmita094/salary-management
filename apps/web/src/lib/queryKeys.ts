import type { EmployeeQuery } from "@acme/shared";

/**
 * Central query-key factory — every key the app uses, in one place, so caches and
 * invalidations stay consistent and precise (e.g. a create invalidates
 * `keys.employees.lists()` and `keys.analytics.all()`).
 */
export const keys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  employees: {
    all: () => ["employees"] as const,
    lists: () => ["employees", "list"] as const,
    list: (query: Partial<EmployeeQuery>) => ["employees", "list", query] as const,
    detail: (id: string) => ["employees", "detail", id] as const,
  },
  analytics: {
    all: () => ["analytics"] as const,
    summary: () => ["analytics", "summary"] as const,
    byDimension: (dimension: string) => ["analytics", "by", dimension] as const,
    distribution: (params: Record<string, unknown>) => ["analytics", "distribution", params] as const,
  },
} as const;
