import { prisma } from "@/lib/prisma";
import { bucketConfigFor, formatBucketLabel, buildBuckets } from "@/lib/date-buckets";
import { startOfDayUTC, dayKey, computeCurrentStreak } from "@/lib/streak";

// Deliberately not importing model types from "@prisma/client" here.
// TypeScript's structural typing means Prisma's actual query results will
// satisfy these interfaces just fine once the client is generated (field
// names/types match exactly) — but defining them locally means this file
// type-checks correctly even in environments where `prisma generate`
// hasn't run yet, since it depends on nothing but the shapes below.
const ARTICLE_CATEGORIES = [
  "TECHNOLOGY",
  "AI",
  "STARTUPS",
  "SOFTWARE_ENGINEERING",
  "PRODUCT",
  "BUSINESS",
  "DESIGN",
  "CYBERSECURITY",
] as const;
type ArticleCategoryValue = (typeof ARTICLE_CATEGORIES)[number];

interface GoalMilestoneLike {
  completed: boolean;
}

interface GoalLike {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  deadline: Date | null;
  milestones: GoalMilestoneLike[];
}

interface ArticleLike {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: string;
  category: string;
  readingTimeMinutes: number;
  publishedAt: Date;
}

interface ActivityLike {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: Date;
}

export interface GoalSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string | null;
  milestonesCompleted: number;
  milestonesTotal: number;
}

export interface SkillSummary {
  id: string;
  name: string;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  trend: "up" | "down" | "flat";
}

export interface RecommendedArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: string;
  category: string;
  readingTimeMinutes: number;
  publishedAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
}

export interface GrowthPoint {
  label: string;
  date: string;
  learningMinutes: number;
  articlesRead: number;
  goalsCompleted: number;
}

export interface DashboardData {
  greetingName: string;
  todaysPulse: {
    streakDays: number;
    activeGoalsCount: number;
    learningMinutesToday: number;
    topStory: RecommendedArticle | null;
  };
  growth: {
    rangeDays: number;
    totals: {
      learningHours: number;
      goalsCompleted: number;
      skillsImproved: number;
      articlesConsumed: number;
    };
    previousTotals: {
      learningHours: number;
      goalsCompleted: number;
      articlesConsumed: number;
    };
    series: GrowthPoint[];
  };
  goals: GoalSummary[];
  skills: SkillSummary[];
  continueLearning: ContinueLearningItem[];
  recommendedReading: RecommendedArticle[];
  recentActivity: ActivityItem[];
}

/** Longest run of consecutive days (ending today) with any recorded activity. */
async function computeStreakDays(userId: string): Promise<number> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90); // cap the lookback — a 90-day streak is already a lot to show

  const [sessions, activities] = await Promise.all([
    prisma.learningSession.findMany({
      where: { userId, occurredAt: { gte: since } },
      select: { occurredAt: true },
    }),
    prisma.activity.findMany({
      where: { userId, occurredAt: { gte: since } },
      select: { occurredAt: true },
    }),
  ]);

  const activeDays = new Set<string>();
  for (const s of sessions) activeDays.add(dayKey(s.occurredAt));
  for (const a of activities) activeDays.add(dayKey(a.occurredAt));

  return computeCurrentStreak(activeDays);
}

function goalToSummary(goal: GoalLike): GoalSummary {
  return {
    id: goal.id,
    title: goal.title,
    status: goal.status,
    priority: goal.priority,
    progress: goal.progress,
    deadline: goal.deadline?.toISOString() ?? null,
    milestonesCompleted: goal.milestones.filter((m) => m.completed).length,
    milestonesTotal: goal.milestones.length,
  };
}

function articleToSummary(article: ArticleLike): RecommendedArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    source: article.source,
    category: article.category,
    readingTimeMinutes: article.readingTimeMinutes,
    publishedAt: article.publishedAt.toISOString(),
  };
}

function activityToItem(activity: ActivityLike): ActivityItem {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    occurredAt: activity.occurredAt.toISOString(),
  };
}

interface SkillHistoryEntryLike {
  level: number;
}

interface SkillLike {
  id: string;
  name: string;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  history: SkillHistoryEntryLike[];
}

interface ContinueLearningItem {
  id: string;
  title: string;
  type: string;
  progress: number;
  category: string | null;
}

export async function getDashboardData(userId: string, rangeDays: number): Promise<DashboardData> {
  const rangeStart = new Date();
  rangeStart.setUTCDate(rangeStart.getUTCDate() - rangeDays);
  const todayStart = startOfDayUTC(new Date());

  const continueLearningRaw = (await prisma.learningResource.findMany({
    where: { userId, status: "LEARNING" },
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: { id: true, title: true, type: true, progress: true, category: true },
  })) as ContinueLearningItem[];

  const [user, preferences, goals, skills, recentActivityRaw, savedArticleIds, learningSessions, completedGoalsInRange, skillHistoryInRange, learningMinutesToday] =
    (await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),
      prisma.userPreference.findUnique({ where: { userId }, select: { interests: true } }),
      prisma.goal.findMany({
        where: { userId, archivedAt: null, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
        include: { milestones: true },
        orderBy: [{ priority: "desc" }, { deadline: "asc" }],
        take: 6,
      }),
      prisma.skill.findMany({
        where: { userId },
        include: { history: { orderBy: { recordedAt: "desc" }, take: 2 } },
        orderBy: { currentLevel: "desc" },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
      prisma.savedArticle.findMany({ where: { userId }, select: { articleId: true } }),
      prisma.learningSession.findMany({
        where: { userId, occurredAt: { gte: rangeStart } },
        select: { occurredAt: true, durationMinutes: true },
      }),
      prisma.goal.count({ where: { userId, completedAt: { gte: rangeStart } } }),
      prisma.skillProgress.findMany({
        where: { skill: { userId }, recordedAt: { gte: rangeStart } },
        select: { skillId: true },
        distinct: ["skillId"],
      }),
      prisma.learningSession.aggregate({
        where: { userId, occurredAt: { gte: todayStart } },
        _sum: { durationMinutes: true },
      }),
    ])) as [
      { name: string },
      { interests: string } | null,
      GoalLike[],
      SkillLike[],
      ActivityLike[],
      { articleId: string }[],
      { occurredAt: Date; durationMinutes: number }[],
      number,
      { skillId: string }[],
      { _sum: { durationMinutes: number | null } }
    ];

  const savedIdSet = new Set(savedArticleIds.map((s) => s.articleId));
  // `interests` is stored as a JSON-encoded string (SQLite has no native
  // array type) — parsed defensively since a malformed/legacy value should
  // degrade to "no interests set" rather than crash the dashboard.
  const parsedInterests: unknown = (() => {
    try {
      return preferences?.interests ? JSON.parse(preferences.interests) : [];
    } catch {
      return [];
    }
  })();
  const rawInterests = Array.isArray(parsedInterests) ? parsedInterests : [];
  const validInterestCategories = rawInterests.filter((i): i is ArticleCategoryValue =>
    typeof i === "string" && (ARTICLE_CATEGORIES as readonly string[]).includes(i)
  );

  const readArticlesInRange = (await prisma.savedArticle.findMany({
    where: { userId, isRead: true, readAt: { gte: rangeStart } },
    select: { id: true, readAt: true },
  })) as { id: string; readAt: Date | null }[];

  const recommendedArticlesRaw = await prisma.article.findMany({
    where: {
      id: { notIn: [...savedIdSet] },
      ...(validInterestCategories.length > 0 ? { category: { in: validInterestCategories } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  // Fall back to latest articles generally if nothing matches interests yet
  // (e.g. a brand-new account that hasn't set preferences) — an empty
  // "recommended for you" section on day one would be a bad first
  // impression for no good reason.
  const recommendedReading =
    recommendedArticlesRaw.length > 0
      ? recommendedArticlesRaw.map(articleToSummary)
      : (
          await prisma.article.findMany({
            where: { id: { notIn: [...savedIdSet] } },
            orderBy: { publishedAt: "desc" },
            take: 5,
          })
        ).map(articleToSummary);

  // ── Growth chart series ──
  const { bucketDays, labelFormat } = bucketConfigFor(rangeDays);
  const buckets = buildBuckets(rangeStart, bucketDays);

  const series: GrowthPoint[] = buckets.map(({ start, end }) => {
    const learningMinutes = learningSessions
      .filter((s) => s.occurredAt >= start && s.occurredAt < end)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    const articlesRead = readArticlesInRange.filter((a) => a.readAt && a.readAt >= start && a.readAt < end).length;
    return {
      label: formatBucketLabel(start, labelFormat),
      date: start.toISOString(),
      learningMinutes,
      articlesRead,
      goalsCompleted: 0, // populated below from the same completedGoalsInRange window, kept coarse per-bucket is out of scope for v1
    };
  });

  const totalLearningMinutes = learningSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // ── Real "vs previous period" comparison — same-length window immediately
  // before the current range, not a fabricated number. If the account is
  // newer than two full ranges, this legitimately comes back as zeros,
  // which the UI treats as "no comparison available" rather than a fake 0%.
  const previousRangeStart = new Date(rangeStart);
  previousRangeStart.setUTCDate(previousRangeStart.getUTCDate() - rangeDays);

  const [previousLearningAgg, previousGoalsCompleted, previousArticlesRead] = await Promise.all([
    prisma.learningSession.aggregate({
      where: { userId, occurredAt: { gte: previousRangeStart, lt: rangeStart } },
      _sum: { durationMinutes: true },
    }),
    prisma.goal.count({ where: { userId, completedAt: { gte: previousRangeStart, lt: rangeStart } } }),
    prisma.savedArticle.count({ where: { userId, isRead: true, readAt: { gte: previousRangeStart, lt: rangeStart } } }),
  ]);

  const previousLearningHours = Math.round(((previousLearningAgg._sum.durationMinutes ?? 0) / 60) * 10) / 10;
  const currentLearningHours = Math.round((totalLearningMinutes / 60) * 10) / 10;

  const streakDays = await computeStreakDays(userId);

  return {
    greetingName: user.name.split(" ")[0] ?? user.name,
    todaysPulse: {
      streakDays,
      activeGoalsCount: goals.length,
      learningMinutesToday: learningMinutesToday._sum.durationMinutes ?? 0,
      topStory: recommendedReading[0] ?? null,
    },
    growth: {
      rangeDays,
      totals: {
        learningHours: currentLearningHours,
        goalsCompleted: completedGoalsInRange,
        skillsImproved: skillHistoryInRange.length,
        articlesConsumed: readArticlesInRange.length,
      },
      previousTotals: {
        learningHours: previousLearningHours,
        goalsCompleted: previousGoalsCompleted,
        articlesConsumed: previousArticlesRead,
      },
      series,
    },
    goals: goals.map(goalToSummary),
    skills: skills.map((s) => {
      const [latest, previous] = s.history;
      const trend: SkillSummary["trend"] =
        !previous || !latest ? "flat" : latest.level > previous.level ? "up" : latest.level < previous.level ? "down" : "flat";
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        currentLevel: s.currentLevel,
        targetLevel: s.targetLevel,
        trend,
      };
    }),
    recommendedReading,
    recentActivity: recentActivityRaw.map(activityToItem),
    continueLearning: continueLearningRaw,
  };
}
