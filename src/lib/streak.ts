/** Normalizes a Date to a UTC day boundary. */
export function startOfDayUTC(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function dayKey(d: Date): string {
  return startOfDayUTC(d).toISOString();
}

/**
 * Counts consecutive active days ending today (inclusive). The moment a day
 * without activity is hit, the streak stops — a gap anywhere does not get
 * "bridged." `activeDayKeys` should be `dayKey()`-formatted ISO strings.
 */
export function computeCurrentStreak(activeDayKeys: Set<string>, today: Date = new Date()): number {
  let streak = 0;
  const cursor = startOfDayUTC(today);
  while (activeDayKeys.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Longest run of consecutive calendar days found anywhere within the given
 * set of active day keys (not necessarily ending today) — used for
 * "longest streak in this window" displays.
 */
export function computeLongestStreak(activeDayKeys: Set<string>): number {
  const sortedTimestamps = Array.from(activeDayKeys)
    .map((iso) => new Date(iso).getTime())
    .sort((a, b) => a - b);

  let longest = 0;
  let running = 0;
  let prev: number | null = null;
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const ts of sortedTimestamps) {
    running = prev !== null && ts - prev === oneDayMs ? running + 1 : 1;
    longest = Math.max(longest, running);
    prev = ts;
  }

  return longest;
}
