import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Each test file gets its own temp SQLite DB (set before the Prisma client loads).
    setupFiles: ["tests/setup-env.ts"],
  },
});
