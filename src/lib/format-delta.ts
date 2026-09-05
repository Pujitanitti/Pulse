/**
 * Formats a real period-over-period comparison for display next to a
 * stat — e.g. "+18% vs previous". Returns null when there's nothing
 * meaningful to say (both periods are zero), rather than showing a
 * misleading "+0%" or a fabricated number.
 */
export function formatDelta(current: number, previous: number): string | null {
  if (previous === 0) {
    if (current === 0) return null;
    return "New this period";
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "No change vs previous";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs previous`;
}
