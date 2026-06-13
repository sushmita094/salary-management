import type { AnalyticsDimension, DistributionQuery } from "@acme/shared";
import { prisma } from "../db/client.js";

/**
 * Analytics reads, computed entirely in SQL (plan §2.3 / §Phase 5) — we never
 * load the table into Node. SQLite has no `PERCENTILE`, so the **median** is
 * found with window functions: rank each row within its partition, then average
 * the value(s) at the middle position. For a partition of `cnt` rows ordered
 * ascending, the median is `AVG` of the rows whose 1-based rank is
 * `(cnt + 1) / 2` and `(cnt + 2) / 2` (integer division) — which collapses to the
 * single middle row when `cnt` is odd and the two middle rows when it's even.
 *
 * Every monetary rollup is partitioned by `salaryCurrency`, because salaries are
 * local and never converted (FX out of scope) — so figures are always per
 * currency, never a false cross-currency total.
 */

/** Whitelist of segment → column. Values are validated by Zod before they reach here. */
const DIMENSION_COLUMNS: Record<AnalyticsDimension, string> = {
  department: "department",
  country: "country",
  jobTitle: "jobTitle",
  level: "level",
};

export interface CurrencyRollupRow {
  currency: string;
  headcount: number;
  totalSpend: number;
  average: number;
  median: number;
}

/** Org-wide headcount/total/average/median, one row per currency. */
export async function summaryByCurrency(): Promise<CurrencyRollupRow[]> {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    WITH ranked AS (
      SELECT salaryCurrency AS currency, salaryAmount AS amount,
             ROW_NUMBER() OVER (PARTITION BY salaryCurrency ORDER BY salaryAmount) AS rn,
             COUNT(*)     OVER (PARTITION BY salaryCurrency)                       AS cnt
      FROM Employee
    ),
    medians AS (
      SELECT currency, AVG(amount) AS median
      FROM ranked
      WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)
      GROUP BY currency
    ),
    aggs AS (
      SELECT salaryCurrency AS currency,
             COUNT(*)         AS headcount,
             SUM(salaryAmount) AS totalSpend,
             AVG(salaryAmount) AS average
      FROM Employee
      GROUP BY salaryCurrency
    )
    SELECT a.currency, a.headcount, a.totalSpend, a.average, m.median
    FROM aggs a
    JOIN medians m ON a.currency = m.currency
    ORDER BY a.currency
  `;

  return rows.map((r) => ({
    currency: String(r.currency),
    headcount: Number(r.headcount),
    totalSpend: Number(r.totalSpend),
    average: Number(r.average),
    median: Number(r.median),
  }));
}

export interface SegmentStatRow {
  value: string;
  currency: string;
  headcount: number;
  average: number;
  median: number;
  min: number;
  max: number;
}

/**
 * Per-(segment value × currency) headcount/average/median/min/max. Grouping by
 * currency as well as the segment keeps money figures within a single currency.
 */
export async function segmentStats(dimension: AnalyticsDimension): Promise<SegmentStatRow[]> {
  // Safe to interpolate: `column` is one of four whitelisted identifiers, never user input.
  const column = DIMENSION_COLUMNS[dimension];

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    WITH base AS (
      SELECT "${column}" AS grp, salaryCurrency AS currency, salaryAmount AS amount
      FROM Employee
    ),
    ranked AS (
      SELECT grp, currency, amount,
             ROW_NUMBER() OVER (PARTITION BY grp, currency ORDER BY amount) AS rn,
             COUNT(*)     OVER (PARTITION BY grp, currency)                 AS cnt
      FROM base
    ),
    medians AS (
      SELECT grp, currency, AVG(amount) AS median
      FROM ranked
      WHERE rn IN ((cnt + 1) / 2, (cnt + 2) / 2)
      GROUP BY grp, currency
    ),
    aggs AS (
      SELECT grp, currency,
             COUNT(*)   AS headcount,
             AVG(amount) AS average,
             MIN(amount) AS minSalary,
             MAX(amount) AS maxSalary
      FROM base
      GROUP BY grp, currency
    )
    SELECT a.grp AS value, a.currency, a.headcount, a.average, m.median, a.minSalary, a.maxSalary
    FROM aggs a
    JOIN medians m ON a.grp = m.grp AND a.currency = m.currency
    ORDER BY a.grp, a.currency
  `);

  return rows.map((r) => ({
    value: String(r.value),
    currency: String(r.currency),
    headcount: Number(r.headcount),
    average: Number(r.average),
    median: Number(r.median),
    min: Number(r.minSalary),
    max: Number(r.maxSalary),
  }));
}

export interface DistributionBucketRow {
  currency: string;
  lo: number;
  hi: number;
  bucket: number;
  count: number;
}

/**
 * Per-currency equal-width histogram counts. Each currency's [min, max] range is
 * split into `bucketCount` bands in SQL (`width_bucket`-style via CASE), and the
 * top value is clamped into the final band. Optional filters scope the population.
 */
export async function distributionBuckets(
  filters: DistributionQuery,
  bucketCount: number,
): Promise<DistributionBucketRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const eq = (column: string, value: string | undefined) => {
    if (value === undefined) return;
    conditions.push(`${column} = ?`);
    params.push(value);
  };
  eq("salaryCurrency", filters.currency);
  eq("country", filters.country);
  eq("department", filters.department);
  eq("jobTitle", filters.jobTitle);
  eq("level", filters.level);
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // bucketCount is a Zod-validated integer (2..50), so interpolating it is safe.
  const n = bucketCount;
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
    WITH base AS (
      SELECT salaryCurrency AS currency, salaryAmount AS amount FROM Employee ${where}
    ),
    bounds AS (
      SELECT currency, MIN(amount) AS lo, MAX(amount) AS hi FROM base GROUP BY currency
    ),
    bucketed AS (
      SELECT b.currency,
             CASE WHEN bo.hi = bo.lo THEN 0
                  ELSE MIN(CAST((b.amount - bo.lo) * ${n} / (bo.hi - bo.lo) AS INTEGER), ${n} - 1)
             END AS bucket
      FROM base b
      JOIN bounds bo ON b.currency = bo.currency
    )
    SELECT bk.currency, bo.lo, bo.hi, bk.bucket, COUNT(*) AS count
    FROM bucketed bk
    JOIN bounds bo ON bk.currency = bo.currency
    GROUP BY bk.currency, bk.bucket
    ORDER BY bk.currency, bk.bucket
  `,
    ...params,
  );

  return rows.map((r) => ({
    currency: String(r.currency),
    lo: Number(r.lo),
    hi: Number(r.hi),
    bucket: Number(r.bucket),
    count: Number(r.count),
  }));
}
