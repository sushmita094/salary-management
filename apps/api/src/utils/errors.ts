/**
 * Typed domain errors. Services and controllers throw these; the central error
 * handler ([middleware/error-handler.ts]) is the only place that turns them into
 * an HTTP status + the shared `{ error: { code, message, details? } }` envelope.
 * No layer writes an error response by hand (plan §2.1).
 */
export abstract class AppError extends Error {
  /** HTTP status the error maps to. */
  abstract readonly status: number;
  /** Stable machine-readable code surfaced in the envelope (e.g. "NOT_FOUND"). */
  abstract readonly code: string;
  /** Optional field-level detail (e.g. Zod validation issues). */
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

/** 400 — request input failed validation. `details` carries the field issues. */
export class ValidationError extends AppError {
  readonly status = 400;
  readonly code = "VALIDATION_ERROR";
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = "NOT_FOUND";
}

/** 409 — the request conflicts with current state (e.g. duplicate email). */
export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = "CONFLICT";
}

/** 401 — the request is not authenticated. */
export class UnauthorizedError extends AppError {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
}
