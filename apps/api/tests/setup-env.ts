import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Runs once per test file (Vitest `setupFiles`), before the test module — and
 * therefore before the Prisma client is imported. Points `DATABASE_URL` at a
 * fresh temp SQLite file so every test file gets an isolated database; the
 * integration suites then migrate and seed it. Pure-unit files simply ignore it.
 */
const dir = mkdtempSync(join(tmpdir(), "acme-api-test-"));
process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
