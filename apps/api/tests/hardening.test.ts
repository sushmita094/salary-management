import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("security headers (helmet)", () => {
  it("sets hardened response headers", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    // helmet removes the framework-advertising header.
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("CORS", () => {
  it("allows the configured web origin with credentials", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});

describe("login rate limiting", () => {
  it("throttles repeated login attempts with a 429 envelope", async () => {
    // The limiter runs before validation, so empty bodies still count as attempts.
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post("/auth/login").send({});
      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app).post("/auth/login").send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("TOO_MANY_REQUESTS");
  });
});
