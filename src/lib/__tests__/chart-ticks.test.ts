import { describe, it, expect } from "vitest";
import { integerTicks } from "@/lib/chart-ticks";

function isStrictlyMonotonic(arr: number[]): boolean {
  return arr.every((v, i) => i === 0 || v > arr[i - 1]!);
}

describe("integerTicks", () => {
  it("always returns a strictly increasing, integer-only sequence", () => {
    for (const max of [0, 1, 3, 5, 7, 20, 90, 137]) {
      const ticks = integerTicks(max);
      expect(isStrictlyMonotonic(ticks)).toBe(true);
      expect(ticks.every((t) => Number.isInteger(t))).toBe(true);
    }
  });

  it("always starts at 0", () => {
    expect(integerTicks(5)[0]).toBe(0);
    expect(integerTicks(90)[0]).toBe(0);
  });

  it("for small ranges (<= maxTicks), returns every integer with no gaps", () => {
    expect(integerTicks(5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(integerTicks(1)).toEqual([0, 1]);
  });

  it("covers at least up to the given max value", () => {
    const ticks = integerTicks(90);
    expect(ticks[ticks.length - 1]!).toBeGreaterThanOrEqual(90);
  });

  it("treats a max of 0 the same as a max of 1 (never returns a single-point axis)", () => {
    expect(integerTicks(0)).toEqual([0, 1]);
  });

  it("never produces more than roughly maxTicks+2 ticks for large ranges", () => {
    const ticks = integerTicks(1000, 5);
    expect(ticks.length).toBeLessThanOrEqual(8);
  });
});
