export type BucketFormat = "day" | "week" | "month";

export interface BucketConfig {
  bucketDays: number;
  labelFormat: BucketFormat;
}

/**
 * Chooses a chart bucket size proportional to the selected range, so a
 * 365-day view doesn't try to render 365 individual daily points (illegible)
 * and a 7-day view doesn't get flattened into a single monthly bucket
 * (useless). Shared by the dashboard growth chart and the analytics page so
 * the two can't silently drift into different bucketing behavior for the
 * same range.
 */
export function bucketConfigFor(rangeDays: number): BucketConfig {
  if (rangeDays <= 30) return { bucketDays: 1, labelFormat: "day" };
  if (rangeDays <= 90) return { bucketDays: 7, labelFormat: "week" };
  return { bucketDays: 30, labelFormat: "month" };
}

export function formatBucketLabel(date: Date, format: BucketFormat): string {
  if (format === "month") return date.toLocaleDateString("en-US", { month: "short" });
  if (format === "week") return `Wk of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Generates the [start, end) bucket boundaries spanning from `rangeStart` to now. */
export function buildBuckets(rangeStart: Date, bucketDays: number, now: Date = new Date()): { start: Date; end: Date }[] {
  const buckets: { start: Date; end: Date }[] = [];
  for (const cursor = new Date(rangeStart); cursor < now; cursor.setUTCDate(cursor.getUTCDate() + bucketDays)) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setUTCDate(end.getUTCDate() + bucketDays);
    buckets.push({ start, end });
  }
  return buckets;
}
