import { prisma } from "@/lib/prisma";
import { bucketConfigFor, formatBucketLabel, buildBuckets } from "@/lib/date-buckets";
import { dayKey, computeCurrentStreak, computeLongestStreak } from "@/lib/streak";

export interface AnalyticsData {
  rangeDays: number;
  growth: {
    skillsImproved: number;
    totalSkillPointsGained: number;
    goalsCompleted: number;
    currentStreak: number;
    longestStreakInRange: number;
    consistencyPercent: number;
    learningMinutesSeries: { label: string; minutes: number }[];
  };
  knowledge: {
    articlesRead: number;
    articlesSaved: number;
    categoriesConsumed: { category: string; count: number }[];
  };
  productivity: {
    learningSessions: number;
    activeGoals: number;
    completionRate: number;
  };
}

export async function getAnalyticsData(userId: string, rangeDays: number): Promise<AnalyticsData> {
  const rangeStart = new Date();
  rangeStart.setUTCDate(rangeStart.getUTCDate() - rangeDays);

  const [
    skillHistoryInRange,
    goalsCompletedInRange,
    learningSessionsInRange,
    articlesReadRows,
    articlesSavedCount,
    activeGoalsCount,
    nonArchivedGoals,
    last90DaysActivity,
  ] = (await Promise.all([
    prisma.skillProgress.findMany({
      where: { skill: { userId }, recordedAt: { gte: rangeStart } },
      select: { skillId: true, level: true, recordedAt: true },
      orderBy: { recordedAt: "asc" },
    }),
    prisma.goal.count({ where: { userId, completedAt: { gte: rangeStart } } }),
    prisma.learningSession.findMany({
      where: { userId, occurredAt: { gte: rangeStart } },
      select: { occurredAt: true, durationMinutes: true },
    }),
    prisma.savedArticle.findMany({
      where: { userId, isRead: true, readAt: { gte: rangeStart } },
      select: { article: { select: { category: true } } },
    }),
    prisma.savedArticle.count({ where: { userId, savedAt: { gte: rangeStart } } }),
    prisma.goal.count({ where: { userId, archivedAt: null, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } } }),
    prisma.goal.findMany({ where: { userId, archivedAt: null }, select: { status: true } }),
    // Capped at 90 days for the streak calculation regardless of the selected
    // range, same reasoning as the growth page: a 90-day streak is already
    // more than enough to show meaningfully, and it keeps this query cheap.
    prisma.activity.findMany({
      where: { userId, occurredAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      select: { occurredAt: true },
    }),
  ])) as [
    { skillId: string; level: number; recordedAt: Date }[],
    number,
    { occurredAt: Date; durationMinutes: number }[],
    { article: { category: string } }[],
    number,
    number,
    { status: string }[],
    { occurredAt: Date }[]
  ];

  // ── Growth: skill improvement ──
  const bySkill = new Map<string, { first: number; last: number }>();
  for (const h of skillHistoryInRange) {
    const existing = bySkill.get(h.skillId);
    if (!existing) bySkill.set(h.skillId, { first: h.level, last: h.level });
    else existing.last = h.level;
  }
  const totalSkillPointsGained = Array.from(bySkill.values()).reduce((sum, s) => sum + Math.max(0, s.last - s.first), 0);

  // ── Growth: streak + consistency ──
  const activeDaySet = new Set(last90DaysActivity.map((a) => dayKey(a.occurredAt)));
  const currentStreak = computeCurrentStreak(activeDaySet);
  const longestStreakInRange = computeLongestStreak(activeDaySet);

  let activeDaysInRange = 0;
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    if (activeDaySet.has(dayKey(d))) activeDaysInRange++;
  }
  const consistencyPercent = Math.round((activeDaysInRange / rangeDays) * 100);

  // ── Growth: learning minutes series for the chart ──
  const { bucketDays, labelFormat } = bucketConfigFor(rangeDays);
  const buckets = buildBuckets(rangeStart, bucketDays);
  const learningMinutesSeries = buckets.map(({ start, end }) => ({
    label: formatBucketLabel(start, labelFormat),
    minutes: learningSessionsInRange
      .filter((s) => s.occurredAt >= start && s.occurredAt < end)
      .reduce((sum, s) => sum + s.durationMinutes, 0),
  }));

  // ── Knowledge: categories consumed ──
  const categoryCounts = new Map<string, number>();
  for (const row of articlesReadRows) {
    const cat = row.article.category;
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  // ── Productivity: completion rate (snapshot across all non-archived goals) ──
  const completedCount = nonArchivedGoals.filter((g) => g.status === "COMPLETED").length;
  const completionRate = nonArchivedGoals.length > 0 ? Math.round((completedCount / nonArchivedGoals.length) * 100) : 0;

  return {
    rangeDays,
    growth: {
      skillsImproved: bySkill.size,
      totalSkillPointsGained,
      goalsCompleted: goalsCompletedInRange,
      currentStreak,
      longestStreakInRange,
      consistencyPercent,
      learningMinutesSeries,
    },
    knowledge: {
      articlesRead: articlesReadRows.length,
      articlesSaved: articlesSavedCount,
      categoriesConsumed: Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count })),
    },
    productivity: {
      learningSessions: learningSessionsInRange.length,
      activeGoals: activeGoalsCount,
      completionRate,
    },
  };
}
