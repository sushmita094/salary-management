import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the real stack: a seeded Express API on :3000 and the Vite dev
 * server on :5173 (which proxies `/api` to the API). The API server seeds a fresh
 * `e2e.db` (the full 10k dataset + the HR-Manager login) before it starts.
 */
const API_ENV = {
  DATABASE_URL: "file:./prisma/e2e.db",
  JWT_SECRET: "e2e-secret-not-for-production",
  AUTH_EMAIL: "hr@acme.example",
  AUTH_PASSWORD: "e2e-password-123",
};

export default defineConfig({
  testDir: "./e2e",
  // A single shared DB, so run serially for deterministic state.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter api run e2e:serve",
      url: "http://localhost:3000/health",
      env: API_ENV,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
