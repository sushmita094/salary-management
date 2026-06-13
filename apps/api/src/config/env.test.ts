import { describe, expect, it } from "vitest";
import { loadConfig } from "./env.js";

describe("loadConfig", () => {
  it("applies dev defaults for an empty environment", () => {
    const c = loadConfig({});

    expect(c).toMatchObject({ port: 3000, isProduction: false, corsOrigin: "http://localhost:5173" });
    expect(c.databaseUrl).toContain("file:");
  });

  it("coerces PORT and rejects a non-numeric one", () => {
    expect(loadConfig({ PORT: "8080" }).port).toBe(8080);
    expect(() => loadConfig({ PORT: "not-a-number" })).toThrow(/environment/i);
  });

  it("fails fast in production when JWT_SECRET is missing or left at the dev default", () => {
    expect(() => loadConfig({ NODE_ENV: "production", DATABASE_URL: "file:./x.db" })).toThrow(/JWT_SECRET/);
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "file:./x.db",
        JWT_SECRET: "dev-insecure-secret-change-me",
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it("fails fast in production when DATABASE_URL is missing", () => {
    expect(() => loadConfig({ NODE_ENV: "production", JWT_SECRET: "a-strong-secret" })).toThrow(/DATABASE_URL/);
  });

  it("accepts a fully configured production environment", () => {
    const c = loadConfig({
      NODE_ENV: "production",
      JWT_SECRET: "a-strong-secret",
      DATABASE_URL: "file:./prod.db",
    });

    expect(c.isProduction).toBe(true);
    expect(c.jwtSecret).toBe("a-strong-secret");
  });
});
