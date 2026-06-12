import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { config } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

// Prisma 7 connects through a driver adapter rather than a built-in engine.
const adapter = new PrismaBetterSqlite3({ url: config.databaseUrl });

/** Single shared Prisma client for the process. */
export const prisma = new PrismaClient({ adapter });
