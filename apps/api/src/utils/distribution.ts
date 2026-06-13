import type { DistributionBand } from "@acme/shared";

/**
 * Turn per-bucket row counts (computed in SQL) into the contiguous, equal-width
 * histogram bands the API returns. The bucketing itself happens in the database
 * (we never pull 10k rows into Node); this is just the small arithmetic of
 * reconstructing band boundaries and filling empty buckets with zero.
 *
 * Bands span `[from, to)`, except the last is inclusive of `to`, which is pinned
 * exactly to `max` so a value equal to `max` lands in the final band without
 * float drift. When every salary is identical (`min === max`) there's no range to
 * split, so a single band carries the whole population.
 */
export function buildBands(
  min: number,
  max: number,
  bucketCount: number,
  counts: Map<number, number>,
): DistributionBand[] {
  if (max <= min) {
    let total = 0;
    for (const count of counts.values()) total += count;
    return [{ from: min, to: max, count: total }];
  }

  const width = (max - min) / bucketCount;
  const bands: DistributionBand[] = [];
  for (let i = 0; i < bucketCount; i += 1) {
    bands.push({
      from: min + i * width,
      to: i === bucketCount - 1 ? max : min + (i + 1) * width,
      count: counts.get(i) ?? 0,
    });
  }
  return bands;
}
