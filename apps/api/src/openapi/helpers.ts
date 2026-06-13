import { errorSchema } from "@acme/shared";
import { z, type ZodType } from "zod";

/**
 * Helpers that turn the shared Zod schemas into OpenAPI fragments, so the spec is
 * generated from the same definitions that validate requests (no drift). Schemas
 * are converted with Zod 4's native `toJSONSchema` targeting OpenAPI 3.0.
 */

type JsonSchema = Record<string, unknown>;

/** Convert a Zod schema to an OpenAPI-flavoured JSON Schema object. */
export function jsonSchema(schema: ZodType): JsonSchema {
  return z.toJSONSchema(schema, { target: "openapi-3.0" }) as JsonSchema;
}

/** A JSON request body from a schema. */
export function jsonBody(schema: ZodType, description = "Request body") {
  return { required: true, description, content: { "application/json": { schema: jsonSchema(schema) } } };
}

/** A JSON response from a schema. */
export function jsonResponse(schema: ZodType, description: string) {
  return { description, content: { "application/json": { schema: jsonSchema(schema) } } };
}

const ERROR_SCHEMA = jsonSchema(errorSchema);

/** An error response using the shared `{ error }` envelope. */
export function errorResponse(description: string) {
  return { description, content: { "application/json": { schema: ERROR_SCHEMA } } };
}

interface ObjectJsonSchema {
  properties?: Record<string, JsonSchema & { default?: unknown }>;
  required?: string[];
}

/** Expand an object schema's properties into OpenAPI `query` parameters. */
export function queryParams(schema: ZodType) {
  const js = jsonSchema(schema) as ObjectJsonSchema;
  const required = new Set(js.required ?? []);
  return Object.entries(js.properties ?? {}).map(([name, prop]) => ({
    name,
    in: "query" as const,
    // A param with a default isn't "required" from the caller's perspective.
    required: required.has(name) && prop.default === undefined,
    schema: prop,
  }));
}

/** Expand an object schema's properties into OpenAPI `path` parameters (always required). */
export function pathParams(schema: ZodType) {
  const js = jsonSchema(schema) as ObjectJsonSchema;
  return Object.entries(js.properties ?? {}).map(([name, prop]) => ({
    name,
    in: "path" as const,
    required: true,
    schema: prop,
  }));
}
