/**
 * Application configuration resolved from the environment.
 *
 * `jwtSecret` and the seed admin credentials fall back to dev defaults so the app
 * and tests run out of the box; Phase 8 (hardening) will fail fast when the real
 * secret is missing in production rather than silently using the default.
 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  isProduction: process.env.NODE_ENV === "production",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  /** Token lifetime (seconds) — 12h, a single HR working session. */
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 60 * 60 * 12),
  /** Seed credential for the single HR-Manager account. */
  adminEmail: process.env.AUTH_EMAIL ?? "hr@acme.example",
  adminPassword: process.env.AUTH_PASSWORD ?? "change-me-please",
} as const;
