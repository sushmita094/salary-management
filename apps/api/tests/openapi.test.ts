import type { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { analyticsRouter } from "../src/routes/analytics.js";
import { authRouter } from "../src/routes/auth.js";
import { employeesRouter } from "../src/routes/employees.js";
import { exportRouter } from "../src/routes/export.js";
import { healthRouter } from "../src/routes/health.js";
import { importRouter } from "../src/routes/import.js";

const app = createApp();

/** The data/auth routers and the prefix each is mounted at (mirrors app.ts). */
const ROUTE_GROUPS: Array<{ prefix: string; router: Router }> = [
  { prefix: "/health", router: healthRouter },
  { prefix: "/auth", router: authRouter },
  { prefix: "/employees", router: employeesRouter },
  { prefix: "/analytics", router: analyticsRouter },
  { prefix: "/import", router: importRouter },
  { prefix: "/export", router: exportRouter },
];

/** Walk the routers to list the real `METHOD path` routes (Express `:id` → OpenAPI `{id}`). */
function actualRoutes(): string[] {
  const routes: string[] = [];
  for (const { prefix, router } of ROUTE_GROUPS) {
    for (const layer of (router as unknown as { stack: RouteLayer[] }).stack) {
      if (!layer.route) continue;
      const path = layer.route.path === "/" ? "" : layer.route.path;
      const full = (prefix + path).replace(/:(\w+)/g, "{$1}");
      for (const method of Object.keys(layer.route.methods)) {
        routes.push(`${method.toUpperCase()} ${full}`);
      }
    }
  }
  return routes;
}

interface RouteLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

describe("GET /openapi.json", () => {
  it("serves a valid OpenAPI 3.0 document with security schemes and tags", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\.0/);
    expect(res.body.info.title).toBe("ACME Salary Management API");
    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({ type: "http", scheme: "bearer" });
    expect(res.body.components.securitySchemes.cookieAuth).toMatchObject({ type: "apiKey", in: "cookie" });
    expect(res.body.tags.map((t: { name: string }) => t.name)).toContain("Analytics");
  });

  it("documents every registered route (coverage stays honest)", async () => {
    const { body } = await request(app).get("/openapi.json");

    const documented = new Set<string>();
    for (const [path, methods] of Object.entries(body.paths as Record<string, Record<string, unknown>>)) {
      for (const method of Object.keys(methods)) documented.add(`${method.toUpperCase()} ${path}`);
    }

    const missing = actualRoutes().filter((route) => !documented.has(route));
    expect(missing).toEqual([]);
  });

  it("marks protected routes with the Bearer/cookie security requirement", async () => {
    const { body } = await request(app).get("/openapi.json");

    expect(body.paths["/employees"].get.security).toEqual([{ bearerAuth: [] }, { cookieAuth: [] }]);
    expect(body.paths["/auth/login"].post.security).toEqual([]); // public
  });
});

describe("GET /docs", () => {
  it("serves the interactive Swagger UI", async () => {
    const res = await request(app).get("/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text.toLowerCase()).toContain("swagger");
  });
});
