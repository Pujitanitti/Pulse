/**
 * Computes an explicit, guaranteed-monotonic set of integer Y-axis ticks.
 * Used instead of Recharts' built-in automatic tick generation, which (for
 * small integer-range datasets, e.g. 0-5) can produce ticks that read as
 * visually out of order once rounded for display. Passing an explicit
 * `ticks` array removes that ambiguity entirely — there is no algorithm
 * left to second-guess.
 */
export function integerTicks(maxValue: number, maxTicks = 5): number[] {
  const safeMax = Math.max(1, Math.ceil(maxValue));
  if (safeMax <= maxTicks) {
    return Array.from({ length: safeMax + 1 }, (_, i) => i);
  }
  const step = Math.ceil(safeMax / maxTicks);
  const ticks: number[] = [];
  for (let v = 0; v <= safeMax + step; v += step) {
    ticks.push(v);
  }
  return ticks;
}
