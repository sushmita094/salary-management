import { Prisma } from "../generated/prisma/client.js";
import { ConflictError, NotFoundError } from "./errors.js";

/** Prisma known-error codes we translate to domain errors at the write boundary. */
const UNIQUE_VIOLATION = "P2002";
const RECORD_NOT_FOUND = "P2025";

/**
 * Translate a Prisma write failure into a typed domain error so callers never
 * leak raw Prisma errors out of the service layer (plan §Phase 4):
 *
 * - `P2002` (unique constraint) → 409 `ConflictError` (duplicate email).
 * - `P2025` (record not found)  → 404 `NotFoundError` (update/delete of a ghost).
 *
 * Anything else is returned untouched for the central handler to treat as a 500.
 * Returns the error to throw rather than throwing, so callers read naturally
 * (`throw mapWriteError(err, id)`).
 */
export function mapWriteError(err: unknown, id?: string): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === UNIQUE_VIOLATION) {
      return new ConflictError("An employee with this email already exists");
    }
    if (err.code === RECORD_NOT_FOUND) {
      return new NotFoundError(id ? `Employee ${id} not found` : "Employee not found");
    }
  }
  return err;
}
