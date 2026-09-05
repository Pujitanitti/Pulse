import { describe, it, expect } from "vitest";
import { bucketConfigFor, formatBucketLabel, buildBuckets } from "@/lib/date-buckets";

describe("bucketConfigFor", () => {
  it("uses daily buckets for 7 and 30 day ranges", () => {
    expect(bucketConfigFor(7)).toEqual({ bucketDays: 1, labelFormat: "day" });
    expect(bucketConfigFor(30)).toEqual({ bucketDays: 1, labelFormat: "day" });
  });

  it("uses weekly buckets for a 90 day range", () => {
    expect(bucketConfigFor(90)).toEqual({ bucketDays: 7, labelFormat: "week" });
  });

  it("uses monthly buckets for a 365 day range", () => {
    expect(bucketConfigFor(365)).toEqual({ bucketDays: 30, labelFormat: "month" });
  });

  it("is monotonic — a longer range never produces a finer bucket than a shorter one", () => {
    const ranges = [7, 30, 90, 365];
    let lastBucketDays = 0;
    for (const r of ranges) {
      const { bucketDays } = bucketConfigFor(r);
      expect(bucketDays).toBeGreaterThanOrEqual(lastBucketDays);
      lastBucketDays = bucketDays;
    }
  });
});

describe("formatBucketLabel", () => {
  const date = new Date("2026-03-15T00:00:00Z");

  it("formats a day label as month + day", () => {
    expect(formatBucketLabel(date, "day")).toBe("Mar 15");
  });

  it("formats a week label with a 'Wk of' prefix", () => {
    expect(formatBucketLabel(date, "week")).toBe("Wk of Mar 15");
  });

  it("formats a month label as just the month", () => {
    expect(formatBucketLabel(date, "month")).toBe("Mar");
  });
});

describe("buildBuckets", () => {
  it("produces the expected number of daily buckets for a 7-day range", () => {
    const now = new Date("2026-03-15T12:00:00Z");
    const rangeStart = new Date("2026-03-08T12:00:00Z");
    const buckets = buildBuckets(rangeStart, 1, now);
    expect(buckets).toHaveLength(7);
  });

  it("each bucket's end matches the next bucket's start (no gaps or overlaps)", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    const rangeStart = new Date("2026-03-01T00:00:00Z");
    const buckets = buildBuckets(rangeStart, 7, now);
    for (let i = 0; i < buckets.length - 1; i++) {
      expect(buckets[i]!.end.getTime()).toBe(buckets[i + 1]!.start.getTime());
    }
  });

  it("returns an empty array when the range start is not before now", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    expect(buildBuckets(now, 1, now)).toHaveLength(0);
  });
});
