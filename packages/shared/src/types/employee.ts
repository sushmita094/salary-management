import type { z } from "zod";
import type { createEmployeeSchema, employeeSchema } from "../schemas/employee.js";

/** An employee record as stored and returned by the API. */
export type Employee = z.infer<typeof employeeSchema>;

/** Payload for creating a new employee (no id yet). */
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
