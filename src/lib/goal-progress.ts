/**
 * A goal's progress is derived from milestone completion once it has any
 * milestones — this is the single place that rounding happens, so the API
 * layer, tests, and any future caller all agree on the same behavior
 * (round-half-up via Math.round, e.g. 1/3 -> 33%, 2/3 -> 67%).
 * Returns null when there are no milestones, signaling "don't touch
 * progress" — a goal with zero milestones keeps its manually-set value.
 */
export function calculateProgressFromMilestones(milestones: { completed: boolean }[]): number | null {
  if (milestones.length === 0) return null;
  const completedCount = milestones.filter((m) => m.completed).length;
  return Math.round((completedCount / milestones.length) * 100);
}
