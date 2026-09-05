import { describe, it, expect } from "vitest";
import { calculateProgressFromMilestones } from "@/lib/goal-progress";

describe("calculateProgressFromMilestones", () => {
  it("returns null (meaning: leave progress untouched) when there are no milestones", () => {
    expect(calculateProgressFromMilestones([])).toBeNull();
  });

  it("returns 0 when no milestones are completed", () => {
    expect(calculateProgressFromMilestones([{ completed: false }, { completed: false }])).toBe(0);
  });

  it("returns 100 when all milestones are completed", () => {
    expect(calculateProgressFromMilestones([{ completed: true }, { completed: true }])).toBe(100);
  });

  it("rounds 1/3 to 33%, matching the value verified against Postgres in Phase 6", () => {
    expect(calculateProgressFromMilestones([{ completed: true }, { completed: false }, { completed: false }])).toBe(33);
  });

  it("rounds 2/3 to 67%", () => {
    expect(calculateProgressFromMilestones([{ completed: true }, { completed: true }, { completed: false }])).toBe(67);
  });

  it("handles a single milestone correctly in both states", () => {
    expect(calculateProgressFromMilestones([{ completed: true }])).toBe(100);
    expect(calculateProgressFromMilestones([{ completed: false }])).toBe(0);
  });
});
