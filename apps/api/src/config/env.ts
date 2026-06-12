/** Application configuration resolved from the environment. */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
} as const;
