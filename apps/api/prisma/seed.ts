import { prisma } from "../src/db/client.js";
import { generateEmployees } from "../src/utils/seed-data.js";

/**
 * Idempotent ~10,000-employee seed. Generation is deterministic (see
 * `src/utils/seed-data.ts`); here we wipe-and-reseed so re-running never
 * duplicates, and write in batches with `createMany` so it finishes in seconds,
 * not minutes (we never hold the dataset open per-row).
 */
const TOTAL = 10_000;
const BATCH_SIZE = 1_000;

async function main(): Promise<void> {
  const employees = generateEmployees(TOTAL);

  // Wipe first → re-running the seed yields exactly TOTAL rows, not a pile-up.
  await prisma.employee.deleteMany();

  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    await prisma.employee.createMany({ data: employees.slice(i, i + BATCH_SIZE) });
  }

  const count = await prisma.employee.count();
  console.log(`Seeded ${count} employees across ${TOTAL === count ? "all" : "some"} batches.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
