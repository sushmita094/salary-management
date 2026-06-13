import { z } from "zod";

/**
 * Application configuration, parsed and validated from the environment at boot.
 *
 * Dev/test defaults keep the app runnable out of the box, but in **production**
 * we fail fast: a missing `DATABASE_URL`, or a missing/placeholder `JWT_SECRET`,
 * aborts startup rather than silently running insecure.
 */

/** The insecure stand-in secret — allowed in dev/test, rejected in production. */
const DEV_JWT_SECRET = "dev-insecure-secret-change-me";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default("file:./prisma/dev.db"),
  JWT_SECRET: z.string().min(1).default(DEV_JWT_SECRET),
  /** Token lifetime (seconds) — 12h, a single HR working session. */
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 12),
  AUTH_EMAIL: z.email().default("hr@acme.example"),
  AUTH_PASSWORD: z.string().min(1).default("change-me-please"),
  /** Browser origin allowed by CORS (the web app in dev). */
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  /** Max JSON request body size. */
  BODY_LIMIT: z.string().min(1).default("1mb"),
});

export interface AppConfig {
  port: number;
  databaseUrl: string;
  isProduction: boolean;
  isTest: boolean;
  jwtSecret: string;
  jwtTtlSeconds: number;
  adminEmail: string;
  adminPassword: string;
  corsOrigin: string;
  bodyLimit: string;
}

/** Parse + validate an environment into config, failing fast on misconfiguration. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const e = parsed.data;
  const isProduction = e.NODE_ENV === "production";

  if (isProduction) {
    // Defaults are fine for dev/test, but never silently in production.
    if (!env.JWT_SECRET || env.JWT_SECRET === DEV_JWT_SECRET) {
      throw new Error("JWT_SECRET must be set to a strong value in production");
    }
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set in production");
    }
  }

  return {
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    isProduction,
    isTest: e.NODE_ENV === "test",
    jwtSecret: e.JWT_SECRET,
    jwtTtlSeconds: e.JWT_TTL_SECONDS,
    adminEmail: e.AUTH_EMAIL,
    adminPassword: e.AUTH_PASSWORD,
    corsOrigin: e.CORS_ORIGIN,
    bodyLimit: e.BODY_LIMIT,
  };
}

/** The resolved config for this process. */
export const config = loadConfig();
