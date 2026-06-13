import { describe, expect, it } from "vitest";
import { buildBands } from "./distribution.js";

describe("buildBands", () => {
  it("splits [min, max] into equal-width bands and fills counts", () => {
    const bands = buildBands(100_000, 400_000, 4, new Map([[0, 1], [1, 1], [2, 1], [3, 1]]));

    expect(bands).toEqual([
      { from: 100_000, to: 175_000, count: 1 },
      { from: 175_000, to: 250_000, count: 1 },
      { from: 250_000, to: 325_000, count: 1 },
      { from: 325_000, to: 400_000, count: 1 },
    ]);
  });

  it("fills buckets with no rows as zero-count bands", () => {
    const bands = buildBands(50_000, 90_000, 4, new Map([[0, 1], [2, 1], [3, 1]]));

    expect(bands.map((b) => b.count)).toEqual([1, 0, 1, 1]);
  });

  it("pins the final band's upper bound exactly to max (no float drift)", () => {
    const bands = buildBands(0, 100, 3, new Map());

    expect(bands.at(-1)?.to).toBe(100);
  });

  it("collapses to a single band when every salary is identical (min === max)", () => {
    const bands = buildBands(80_000, 80_000, 10, new Map([[0, 5]]));

    expect(bands).toEqual([{ from: 80_000, to: 80_000, count: 5 }]);
  });
});
