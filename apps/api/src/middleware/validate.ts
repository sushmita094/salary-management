import type { RequestHandler } from "express";
import { ZodError, type ZodType } from "zod";
import { ValidationError } from "../utils/errors.js";

/** Zod schemas for the request locations a route wants validated. */
interface ValidationSchemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

/**
 * Validates request input at the boundary (plan §2.2). Each provided schema
 * parses its location and the typed result is stashed on `res.locals` for the
 * controller to read — controllers never touch `req.body`/`req.query` raw. (In
 * Express 5 `req.query` is a read-only getter, so we don't reassign it.)
 *
 * A parse failure becomes a `ValidationError` (→ 400 + error envelope) carrying
 * the field-level issues; any other error is forwarded untouched.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      if (schemas.params) res.locals.params = schemas.params.parse(req.params);
      if (schemas.query) res.locals.query = schemas.query.parse(req.query);
      if (schemas.body) res.locals.body = schemas.body.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Request validation failed", details));
      } else {
        next(error);
      }
    }
  };
}
