import { describe, it, expect } from "vitest";
import { formatDelta } from "@/lib/format-delta";

describe("formatDelta", () => {
  it("returns null when both periods are zero (nothing to compare)", () => {
    expect(formatDelta(0, 0)).toBeNull();
  });

  it("returns 'New this period' when there was no previous activity but there is now", () => {
    expect(formatDelta(5, 0)).toBe("New this period");
  });

  it("formats a positive change with a leading +", () => {
    expect(formatDelta(118, 100)).toBe("+18% vs previous");
  });

  it("formats a negative change without a double negative sign", () => {
    expect(formatDelta(80, 100)).toBe("-20% vs previous");
  });

  it("reports no change when the value is identical", () => {
    expect(formatDelta(50, 50)).toBe("No change vs previous");
  });

  it("rounds to the nearest whole percent", () => {
    expect(formatDelta(103, 100)).toBe("+3% vs previous");
  });
});
