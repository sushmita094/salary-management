import {
  analyticsByDimensionSchema,
  analyticsDimensionParamsSchema,
  analyticsDistributionSchema,
  analyticsSummarySchema,
  authUserSchema,
  createEmployeeSchema,
  distributionQuerySchema,
  employeeParamsSchema,
  employeeQuerySchema,
  employeeSchema,
  exportQuerySchema,
  importResultSchema,
  loginResponseSchema,
  loginSchema,
  paginatedSchema,
  updateEmployeeSchema,
} from "@acme/shared";
import { z } from "zod";
import { config } from "../config/env.js";
import { errorResponse, jsonBody, jsonResponse, pathParams, queryParams } from "./helpers.js";

/** Routes accept the session token as a Bearer header or the httpOnly cookie. */
const SECURED = [{ bearerAuth: [] }, { cookieAuth: [] }];

const noContent = (description: string) => ({ description });
const paginatedEmployeeSchema = paginatedSchema(employeeSchema);

/** A multipart upload body with a single `file` field. */
const fileUploadBody = {
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        type: "object",
        properties: { file: { type: "string", format: "binary" } },
        required: ["file"],
      },
    },
  },
};

/**
 * The OpenAPI 3.0 document, assembled from the shared Zod schemas. Built once and
 * served at `/openapi.json`; the Swagger UI at `/docs` renders it.
 */
export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "ACME Salary Management API",
      version: "1.0.0",
      description:
        "Compensation data for ~10,000 employees. Sign in via POST /auth/login, then click " +
        "**Authorize** and paste the returned token to call protected endpoints (the login cookie " +
        "also works same-origin). Money is always reported per local currency — no FX.",
    },
    servers: [
      { url: "/", description: "This server" },
      { url: `http://localhost:${config.port}`, description: "Local dev" },
    ],
    tags: [
      { name: "System" },
      { name: "Auth" },
      { name: "Employees" },
      { name: "Analytics" },
      { name: "Import/Export" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Liveness probe",
          security: [],
          responses: { "200": jsonResponse(z.object({ status: z.literal("ok") }), "Service is up") },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Sign in",
          security: [],
          requestBody: jsonBody(loginSchema, "Credentials"),
          responses: {
            "200": jsonResponse(loginResponseSchema, "Signed in — sets httpOnly cookie and echoes the token"),
            "400": errorResponse("Validation error"),
            "401": errorResponse("Invalid email or password"),
            "429": errorResponse("Too many login attempts"),
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Sign out",
          security: SECURED,
          responses: { "204": noContent("Signed out — cookie cleared"), "401": errorResponse("Not authenticated") },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current user",
          security: SECURED,
          responses: { "200": jsonResponse(authUserSchema, "The signed-in user"), "401": errorResponse("Not authenticated") },
        },
      },
      "/employees": {
        get: {
          tags: ["Employees"],
          summary: "List employees (paginate / search / filter / sort)",
          security: SECURED,
          parameters: queryParams(employeeQuerySchema),
          responses: {
            "200": jsonResponse(paginatedEmployeeSchema, "A page of employees"),
            "400": errorResponse("Invalid query"),
            "401": errorResponse("Not authenticated"),
          },
        },
        post: {
          tags: ["Employees"],
          summary: "Create an employee",
          security: SECURED,
          requestBody: jsonBody(createEmployeeSchema, "New employee"),
          responses: {
            "201": jsonResponse(employeeSchema, "Created"),
            "400": errorResponse("Validation error"),
            "401": errorResponse("Not authenticated"),
            "409": errorResponse("Duplicate email"),
          },
        },
      },
      "/employees/{id}": {
        get: {
          tags: ["Employees"],
          summary: "Get an employee",
          security: SECURED,
          parameters: pathParams(employeeParamsSchema),
          responses: {
            "200": jsonResponse(employeeSchema, "The employee"),
            "401": errorResponse("Not authenticated"),
            "404": errorResponse("Not found"),
          },
        },
        put: {
          tags: ["Employees"],
          summary: "Update an employee (partial)",
          security: SECURED,
          parameters: pathParams(employeeParamsSchema),
          requestBody: jsonBody(updateEmployeeSchema, "Fields to change"),
          responses: {
            "200": jsonResponse(employeeSchema, "Updated"),
            "400": errorResponse("Validation error"),
            "401": errorResponse("Not authenticated"),
            "404": errorResponse("Not found"),
            "409": errorResponse("Duplicate email"),
          },
        },
        delete: {
          tags: ["Employees"],
          summary: "Delete an employee",
          security: SECURED,
          parameters: pathParams(employeeParamsSchema),
          responses: {
            "204": noContent("Deleted"),
            "401": errorResponse("Not authenticated"),
            "404": errorResponse("Not found"),
          },
        },
      },
      "/analytics/summary": {
        get: {
          tags: ["Analytics"],
          summary: "Org-wide totals, headcount, average & median (per currency)",
          security: SECURED,
          responses: {
            "200": jsonResponse(analyticsSummarySchema, "Summary"),
            "401": errorResponse("Not authenticated"),
          },
        },
      },
      "/analytics/by/{dimension}": {
        get: {
          tags: ["Analytics"],
          summary: "Per-segment stats (avg/median/min/max) by dimension",
          security: SECURED,
          parameters: pathParams(analyticsDimensionParamsSchema),
          responses: {
            "200": jsonResponse(analyticsByDimensionSchema, "Per-segment stats"),
            "400": errorResponse("Unknown dimension"),
            "401": errorResponse("Not authenticated"),
          },
        },
      },
      "/analytics/distribution": {
        get: {
          tags: ["Analytics"],
          summary: "Pay-band histogram per currency",
          security: SECURED,
          parameters: queryParams(distributionQuerySchema),
          responses: {
            "200": jsonResponse(analyticsDistributionSchema, "Distribution"),
            "400": errorResponse("Invalid query"),
            "401": errorResponse("Not authenticated"),
          },
        },
      },
      "/import": {
        post: {
          tags: ["Import/Export"],
          summary: "Bulk import employees from CSV/XLSX (upsert by email)",
          security: SECURED,
          requestBody: fileUploadBody,
          responses: {
            "200": jsonResponse(importResultSchema, "Per-row import report"),
            "400": errorResponse("No file or header mismatch"),
            "401": errorResponse("Not authenticated"),
          },
        },
      },
      "/export": {
        get: {
          tags: ["Import/Export"],
          summary: "Export the filtered directory as CSV/XLSX",
          security: SECURED,
          parameters: queryParams(exportQuerySchema),
          responses: {
            "200": {
              description: "The filtered employees as a downloadable file",
              content: {
                "text/csv": { schema: { type: "string" } },
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            "401": errorResponse("Not authenticated"),
          },
        },
      },
    },
  };
}
