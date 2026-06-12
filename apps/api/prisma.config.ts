import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config. The database URL lives here (and on the runtime adapter),
 * no longer in schema.prisma. SQLite goes through the better-sqlite3 driver
 * adapter — see src/db/client.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
