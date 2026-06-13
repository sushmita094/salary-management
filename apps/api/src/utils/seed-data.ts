import { faker } from "@faker-js/faker";
import type { CreateEmployee } from "@acme/shared";

/**
 * Deterministic generation of a realistic employee dataset for the seed.
 *
 * Kept as a pure, side-effect-free module (no DB) so it can be unit-tested and
 * reused; the actual writes live in `prisma/seed.ts`. Seeding Faker with a fixed
 * value makes every run reproducible — the same 10k people every time.
 */

/** Fixed Faker seed so the dataset is identical across runs and machines. */
export const SEED = 20260612;

/**
 * Countries we hire in, each with its ISO 4217 local currency and a *median
 * base salary for a mid-level employee in that currency*. Salaries are local and
 * never converted (FX is out of scope — requirements §6), so these baselines live
 * in wildly different magnitudes on purpose (¥7M, ₹1.8M, $120k) to exercise the
 * per-currency analytics rollups.
 */
export const COUNTRIES = [
  { name: "United States", currency: "USD", midSalary: 120_000 },
  { name: "United Kingdom", currency: "GBP", midSalary: 65_000 },
  { name: "Germany", currency: "EUR", midSalary: 70_000 },
  { name: "France", currency: "EUR", midSalary: 55_000 },
  { name: "Netherlands", currency: "EUR", midSalary: 68_000 },
  { name: "Canada", currency: "CAD", midSalary: 95_000 },
  { name: "Australia", currency: "AUD", midSalary: 110_000 },
  { name: "India", currency: "INR", midSalary: 1_800_000 },
  { name: "Singapore", currency: "SGD", midSalary: 90_000 },
  { name: "Japan", currency: "JPY", midSalary: 7_000_000 },
  { name: "Brazil", currency: "BRL", midSalary: 150_000 },
  { name: "Poland", currency: "PLN", midSalary: 160_000 },
] as const;

/** Departments and the job titles that belong to each (jobTitle is constrained to its department). */
export const DEPARTMENTS: Record<string, readonly string[]> = {
  Engineering: ["Software Engineer", "Frontend Engineer", "Backend Engineer", "QA Engineer", "DevOps Engineer", "Engineering Manager"],
  Product: ["Product Manager", "Product Designer", "UX Researcher"],
  Sales: ["Account Executive", "Sales Development Rep", "Sales Manager", "Solutions Engineer"],
  Marketing: ["Marketing Specialist", "Content Strategist", "Growth Marketer", "Brand Manager"],
  Finance: ["Financial Analyst", "Accountant", "Controller", "FP&A Manager"],
  "People & HR": ["Recruiter", "HR Business Partner", "People Operations Specialist"],
  Operations: ["Operations Analyst", "Program Manager", "Office Manager"],
  "Customer Support": ["Support Specialist", "Customer Success Manager", "Support Team Lead"],
  Legal: ["Legal Counsel", "Compliance Specialist", "Contracts Manager"],
  "Data & Analytics": ["Data Analyst", "Data Engineer", "Data Scientist", "Analytics Manager"],
};

/**
 * Seniority bands, with a multiplier applied to a country's mid-level baseline and
 * a sampling weight (a real org is pyramid-shaped: many ICs, few directors).
 */
export const LEVELS = [
  { name: "Junior", multiplier: 0.65, weight: 18 },
  { name: "Mid", multiplier: 1.0, weight: 30 },
  { name: "Senior", multiplier: 1.5, weight: 24 },
  { name: "Lead", multiplier: 1.85, weight: 9 },
  { name: "Staff", multiplier: 2.1, weight: 7 },
  { name: "Manager", multiplier: 2.3, weight: 6 },
  { name: "Principal", multiplier: 2.8, weight: 3 },
  { name: "Director", multiplier: 3.6, weight: 3 },
] as const;

const DEPARTMENT_NAMES = Object.keys(DEPARTMENTS);

/** A single row ready for `prisma.employee.createMany` (server fills id/timestamps). */
export type EmployeeSeed = CreateEmployee;

/** Standard-normal sample via Box–Muller, drawing its uniforms from seeded Faker (so it's deterministic). */
function standardNormal(): number {
  const u1 = faker.number.float({ min: 1e-9, max: 1 });
  const u2 = faker.number.float({ min: 0, max: 1 });
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Round to a believable, human-looking figure scaled to the salary's magnitude. */
function roundSalary(value: number): number {
  const step = value >= 1_000_000 ? 10_000 : value >= 100_000 ? 1_000 : 100;
  return Math.max(step, Math.round(value / step) * step);
}

/**
 * A log-normal salary centred on the (country mid-salary × level multiplier) median.
 * Most people cluster near the median; a small fraction draw from a wider spread to
 * create realistic outliers, so medians and pay bands are meaningful, not uniform noise.
 */
function sampleSalary(median: number): number {
  const isOutlier = faker.number.float() < 0.04;
  const sigma = isOutlier ? 0.55 : 0.22;
  return roundSalary(median * Math.exp(sigma * standardNormal()));
}

/**
 * Build `count` deterministic employees. Re-seeds Faker on every call, so the
 * output depends only on `count` — calling it twice yields identical data, and
 * the same row order each time keeps the seed reproducible.
 */
export function generateEmployees(count: number): EmployeeSeed[] {
  faker.seed(SEED);

  const employees: EmployeeSeed[] = [];
  for (let i = 0; i < count; i += 1) {
    const country = faker.helpers.arrayElement(COUNTRIES);
    const level = faker.helpers.weightedArrayElement(
      LEVELS.map((l) => ({ value: l, weight: l.weight })),
    );
    const department = faker.helpers.arrayElement(DEPARTMENT_NAMES);
    const jobTitle = faker.helpers.arrayElement(DEPARTMENTS[department] ?? []);

    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Index suffix guarantees uniqueness against the `email @unique` constraint,
    // even when Faker repeats a name across 10k rows.
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    const email = `${slug(firstName)}.${slug(lastName)}.${i}@acme.example`;

    employees.push({
      name: `${firstName} ${lastName}`,
      email,
      country: country.name,
      department,
      jobTitle,
      level: level.name,
      salaryAmount: sampleSalary(country.midSalary * level.multiplier),
      salaryCurrency: country.currency,
    });
  }

  return employees;
}
