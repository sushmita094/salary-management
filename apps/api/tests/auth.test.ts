import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { authHeader, seedUser } from "./helpers/auth.js";
import { migrateTestDb } from "./helpers/db.js";

const app = createApp();
const EMAIL = "hr@acme.example";
const PASSWORD = "s3cret-password";

beforeAll(() => {
  migrateTestDb();
});

beforeEach(async () => {
  await prisma.user.deleteMany();
  await seedUser(EMAIL, PASSWORD);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /auth/login", () => {
  it("signs in valid credentials, sets an httpOnly cookie, and echoes the token", async () => {
    const res = await request(app).post("/auth/login").send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: EMAIL });
    expect(typeof res.body.token).toBe("string");
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.join(";")).toMatch(/token=.*HttpOnly/i);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app).post("/auth/login").send({ email: EMAIL, password: "nope" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an unknown email with the same 401", async () => {
    const res = await request(app).post("/auth/login").send({ email: "ghost@acme.example", password: PASSWORD });

    expect(res.status).toBe(401);
  });

  it("rejects a malformed body with 400", async () => {
    const res = await request(app).post("/auth/login").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("the auth gate on data routes", () => {
  it("blocks an unauthenticated request with 401", async () => {
    const res = await request(app).get("/employees");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("blocks a bad/expired token with 401", async () => {
    const res = await request(app).get("/employees").set("Authorization", "Bearer garbage.token");

    expect(res.status).toBe(401);
  });

  it("allows access via a Bearer token", async () => {
    const res = await request(app).get("/employees").set(authHeader());

    expect(res.status).toBe(200);
  });

  it("allows access via the login cookie", async () => {
    const login = await request(app).post("/auth/login").send({ email: EMAIL, password: PASSWORD });
    const cookie = login.headers["set-cookie"] as unknown as string[];

    const res = await request(app).get("/employees").set("Cookie", cookie);

    expect(res.status).toBe(200);
  });
});

describe("GET /auth/me and POST /auth/logout", () => {
  it("returns the current user for a valid token", async () => {
    const res = await request(app).get("/auth/me").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: EMAIL });
  });

  it("clears the session cookie on logout", async () => {
    const res = await request(app).post("/auth/logout").set(authHeader());

    expect(res.status).toBe(204);
    const cookies = (res.headers["set-cookie"] as unknown as string[]).join(";");
    expect(cookies).toMatch(/token=;/); // cleared
  });

  it("requires auth for /auth/me", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
  });
});
