/**
 * Single shared style object for every Recharts <Tooltip>, so all charts
 * across the app render an identical tooltip — same border, radius, font
 * size, background — rather than six independently-maintained copies of
 * the same object that could quietly drift apart over time.
 */
export const chartTooltipStyle = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

/** Shared axis tick style, same reasoning. */
export const chartTickStyle = {
  fontSize: 11,
  fill: "hsl(var(--foreground) / 0.5)",
};
