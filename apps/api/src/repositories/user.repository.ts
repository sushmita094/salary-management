import { prisma } from "../db/client.js";

/** Look up the user by email — the login path. Returns `null` if none. */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Create-or-update the single HR-Manager account by email (used by the seed),
 * so re-seeding never duplicates the user or fails on the unique constraint.
 */
export function upsertUser(email: string, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
}
