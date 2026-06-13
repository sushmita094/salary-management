import { z } from "zod";

/**
 * Path params for the single-employee routes (`/employees/:id`). The id is a
 * server-assigned uuid, so a malformed id is rejected at the boundary (400)
 * before it ever reaches the database.
 */
export const employeeParamsSchema = z.object({
  id: z.string().uuid(),
});
