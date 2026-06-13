import Database from "better-sqlite3";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../prisma/migrations");

/**
 * Bring the test database (the temp file `setup-env.ts` pointed `DATABASE_URL`
 * at) up to schema by replaying the committed migration SQL in order. We run it
 * directly through better-sqlite3 rather than the Prisma CLI so it's fast and
 * in-process — and it exercises exactly what the real migrations produce.
 */
export function migrateTestDb(): void {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — tests/setup-env.ts must run first");

  const file = url.replace(/^file:/, "");
  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((name) => statSync(join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();

  const db = new Database(file);
  try {
    for (const migration of migrations) {
      db.exec(readFileSync(join(MIGRATIONS_DIR, migration, "migration.sql"), "utf8"));
    }
  } finally {
    db.close();
  }
}
