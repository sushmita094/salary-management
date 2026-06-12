import { z } from "zod";

/**
 * The single error envelope the API ever returns, produced only by the central
 * error handler. `code` is a stable machine string (e.g. "NOT_FOUND"), `message`
 * is human-readable, and `details` optionally carries field-level validation info.
 */
export const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
