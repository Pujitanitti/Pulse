import { describe, it, expect } from "vitest";
import { startOfDayUTC, dayKey, computeCurrentStreak, computeLongestStreak } from "@/lib/streak";

function daysAgoKey(n: number, from: Date): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return dayKey(d);
}

describe("startOfDayUTC / dayKey", () => {
  it("normalizes different times on the same UTC day to the same key", () => {
    const morning = new Date("2026-03-15T01:00:00Z");
    const night = new Date("2026-03-15T23:59:00Z");
    expect(dayKey(morning)).toBe(dayKey(night));
  });

  it("produces different keys for different days", () => {
    const day1 = new Date("2026-03-15T12:00:00Z");
    const day2 = new Date("2026-03-16T12:00:00Z");
    expect(dayKey(day1)).not.toBe(dayKey(day2));
  });

  it("zeroes out the time component", () => {
    const d = startOfDayUTC(new Date("2026-03-15T14:32:10Z"));
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
  });
});

describe("computeCurrentStreak", () => {
  const today = new Date("2026-03-15T12:00:00Z");

  it("returns 0 when there is no activity at all", () => {
    expect(computeCurrentStreak(new Set(), today)).toBe(0);
  });

  it("returns 0 when today has no activity, even if yesterday does", () => {
    const active = new Set([daysAgoKey(1, today)]);
    expect(computeCurrentStreak(active, today)).toBe(0);
  });

  it("counts consecutive active days ending today", () => {
    const active = new Set([daysAgoKey(0, today), daysAgoKey(1, today), daysAgoKey(2, today)]);
    expect(computeCurrentStreak(active, today)).toBe(3);
  });

  it("stops counting at the first gap rather than skipping over it", () => {
    // Active today, yesterday, day-before — then a gap, then more activity further back.
    const active = new Set([daysAgoKey(0, today), daysAgoKey(1, today), daysAgoKey(2, today), daysAgoKey(5, today), daysAgoKey(6, today)]);
    expect(computeCurrentStreak(active, today)).toBe(3);
  });

  it("a single active day (today only) yields a streak of 1", () => {
    expect(computeCurrentStreak(new Set([daysAgoKey(0, today)]), today)).toBe(1);
  });
});

describe("computeLongestStreak", () => {
  const today = new Date("2026-03-15T12:00:00Z");

  it("returns 0 for no active days", () => {
    expect(computeLongestStreak(new Set())).toBe(0);
  });

  it("finds the longest run even if it isn't the most recent one", () => {
    // A 2-day run near "today", and a longer 4-day run further in the past.
    const active = new Set([
      daysAgoKey(0, today),
      daysAgoKey(1, today),
      daysAgoKey(10, today),
      daysAgoKey(11, today),
      daysAgoKey(12, today),
      daysAgoKey(13, today),
    ]);
    expect(computeLongestStreak(active)).toBe(4);
  });

  it("treats non-consecutive isolated days as separate runs of length 1", () => {
    const active = new Set([daysAgoKey(0, today), daysAgoKey(5, today), daysAgoKey(10, today)]);
    expect(computeLongestStreak(active)).toBe(1);
  });

  it("counts every day in one unbroken run", () => {
    const active = new Set(Array.from({ length: 30 }, (_, i) => daysAgoKey(i, today)));
    expect(computeLongestStreak(active)).toBe(30);
  });
});
