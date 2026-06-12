import { z } from "zod";

/** Pagination metadata returned alongside every list response. */
export const paginationSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

/**
 * Wraps an item schema in the standard list envelope `{ data, pagination }`.
 * Used both to type list responses and to register them with OpenAPI later.
 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    pagination: paginationSchema,
  });
}
