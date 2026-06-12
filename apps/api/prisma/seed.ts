import { prisma } from "../src/db/client.js";

/**
 * Seed stub. The full, idempotent ~10,000-employee Faker seed (multi-country,
 * realistic salary distribution) lands in a later plan; this proves the wiring.
 */
async function main(): Promise<void> {
  console.log("Seed stub — no data inserted yet.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
