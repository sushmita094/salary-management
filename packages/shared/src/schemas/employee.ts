import { z } from "zod";

/**
 * Minimal Employee schema — enough to prove the shared-types wiring across api and web.
 * The full compensation model (levels, distribution bands, import rows) lands in a later
 * feature plan; this is the one definition both sides import.
 */
export const employeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  /** Base salary in the employee's local currency (see requirements §5.2). */
  salaryAmount: z.number().nonnegative(),
  /** ISO 4217 currency code, e.g. "EUR", "USD". */
  salaryCurrency: z.string().length(3),
});

/** Shape accepted when creating an employee — the server assigns the id. */
export const createEmployeeSchema = employeeSchema.omit({ id: true });
