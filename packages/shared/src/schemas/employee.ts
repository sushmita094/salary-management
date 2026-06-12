import { z } from "zod";

/**
 * The Employee record as stored and returned by the API — the single definition
 * both the api and web apps import (one shape across the wire).
 *
 * `createdAt`/`updatedAt` are ISO 8601 date-time strings: Prisma holds them as
 * `Date`, and `res.json` serialises them to strings on the way out, so the wire
 * contract the frontend consumes is a string.
 */
export const employeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  /** Seniority band (e.g. "L3", "Senior") — an analytics segment per requirements §5.3. */
  level: z.string().min(1),
  /** Base salary in the employee's local currency (see requirements §5.2). */
  salaryAmount: z.number().nonnegative(),
  /** ISO 4217 currency code, e.g. "EUR", "USD". */
  salaryCurrency: z.string().length(3),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Shape accepted when creating an employee — the server assigns `id` and the
 * `createdAt`/`updatedAt` timestamps.
 */
export const createEmployeeSchema = employeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Shape accepted when updating an employee. Every field is optional so the same
 * schema serves PATCH (partial) and PUT (full replace, where the caller simply
 * sends every field). The server owns id/timestamps, so they are not accepted.
 */
export const updateEmployeeSchema = createEmployeeSchema.partial();
