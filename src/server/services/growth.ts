import { prisma } from "@/lib/prisma";
import type {
  AddSkillInput,
  UpdateSkillInput,
  AddLearningResourceInput,
  UpdateLearningResourceInput,
  ListLearningResourcesQuery,
  LogLearningSessionInput,
} from "@/server/validation/growth";

export class NotFoundError extends Error {}

interface SkillHistoryPointLike {
  level: number;
  recordedAt: Date;
  note: string | null;
}
interface SkillLike {
  id: string;
  name: string;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  history: SkillHistoryPointLike[];
}
interface LearningResourceLike {
  id: string;
  title: string;
  type: string;
  category: string | null;
  url: string | null;
  status: string;
  progress: number;
  rating: number | null;
  notes: string | null;
  updatedAt: Date;
}
interface LearningSessionAggLike {
  resourceId: string | null;
  _sum: { durationMinutes: number | null };
  _count: { _all: number };
  _max: { occurredAt: Date | null };
}

export interface SkillDetail {
  id: string;
  name: string;
  category: string | null;
  currentLevel: number;
  targetLevel: number;
  history: { date: string; level: number; note: string | null }[];
}

export interface LearningResourceDetail {
  id: string;
  title: string;
  type: string;
  category: string | null;
  url: string | null;
  status: string;
  progress: number;
  rating: number | null;
  notes: string | null;
  totalMinutes: number;
  sessionCount: number;
  lastSessionAt: string | null;
}

export interface HeatmapPoint {
  date: string;
  minutes: number;
}

export interface MonthlyGrowthPoint {
  month: string;
  learningHours: number;
  skillsImproved: number;
  resourcesCompleted: number;
}

export interface GrowthData {
  skills: SkillDetail[];
  learningResources: LearningResourceDetail[];
  heatmap: HeatmapPoint[];
  monthlyGrowth: MonthlyGrowthPoint[];
}

function toDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getGrowthData(userId: string): Promise<GrowthData> {
  const heatmapStart = new Date();
  heatmapStart.setUTCDate(heatmapStart.getUTCDate() - 119);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);
  sixMonthsAgo.setUTCDate(1);

  const [skillsRaw, resourcesRaw, sessionAggByResource, heatmapSessions, monthlySkillProgress, monthlySessions, monthlyCompletedResources] =
    (await Promise.all([
      prisma.skill.findMany({
        where: { userId },
        include: { history: { orderBy: { recordedAt: "asc" } } },
        orderBy: { currentLevel: "desc" },
      }),
      prisma.learningResource.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.learningSession.groupBy({
        by: ["resourceId"],
        where: { userId },
        _sum: { durationMinutes: true },
        _count: { _all: true },
        _max: { occurredAt: true },
      }),
      prisma.learningSession.findMany({
        where: { userId, occurredAt: { gte: heatmapStart } },
        select: { occurredAt: true, durationMinutes: true },
      }),
      prisma.skillProgress.findMany({
        where: { skill: { userId }, recordedAt: { gte: sixMonthsAgo } },
        select: { skillId: true, recordedAt: true },
      }),
      prisma.learningSession.findMany({
        where: { userId, occurredAt: { gte: sixMonthsAgo } },
        select: { occurredAt: true, durationMinutes: true },
      }),
      prisma.learningResource.findMany({
        where: { userId, status: "COMPLETED", updatedAt: { gte: sixMonthsAgo } },
        select: { updatedAt: true },
      }),
    ])) as [
      SkillLike[],
      LearningResourceLike[],
      LearningSessionAggLike[],
      { occurredAt: Date; durationMinutes: number }[],
      { skillId: string; recordedAt: Date }[],
      { occurredAt: Date; durationMinutes: number }[],
      { updatedAt: Date }[]
    ];

  const sessionStatsByResource = new Map(sessionAggByResource.filter((s) => s.resourceId).map((s) => [s.resourceId as string, s]));

  const skills: SkillDetail[] = skillsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    currentLevel: s.currentLevel,
    targetLevel: s.targetLevel,
    history: s.history.map((h) => ({ date: h.recordedAt.toISOString(), level: h.level, note: h.note })),
  }));

  const learningResources: LearningResourceDetail[] = resourcesRaw.map((r) => {
    const stats = sessionStatsByResource.get(r.id);
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      category: r.category,
      url: r.url,
      status: r.status,
      progress: r.progress,
      rating: r.rating,
      notes: r.notes,
      totalMinutes: stats?._sum.durationMinutes ?? 0,
      sessionCount: stats?._count._all ?? 0,
      lastSessionAt: stats?._max.occurredAt?.toISOString() ?? null,
    };
  });

  // ── Heatmap: 120 days, zero-filled so the calendar grid has no gaps ──
  const minutesByDay = new Map<string, number>();
  for (const s of heatmapSessions) {
    const key = toDayKey(s.occurredAt);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + s.durationMinutes);
  }
  const heatmap: HeatmapPoint[] = [];
  for (let cursor = new Date(heatmapStart); cursor <= new Date(); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = toDayKey(cursor);
    heatmap.push({ date: key, minutes: minutesByDay.get(key) ?? 0 });
  }

  // ── Monthly growth: last 6 calendar months ──
  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

  const months: { key: string; label: string; date: Date }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setUTCMonth(d.getUTCMonth() + i);
    months.push({ key: monthKey(d), label: monthLabel(d), date: d });
  }

  const minutesByMonth = new Map<string, number>();
  for (const s of monthlySessions) {
    const k = monthKey(s.occurredAt);
    minutesByMonth.set(k, (minutesByMonth.get(k) ?? 0) + s.durationMinutes);
  }
  const skillIdsByMonth = new Map<string, Set<string>>();
  for (const sp of monthlySkillProgress) {
    const k = monthKey(sp.recordedAt);
    const set = skillIdsByMonth.get(k) ?? new Set<string>();
    set.add(sp.skillId);
    skillIdsByMonth.set(k, set);
  }
  const completedByMonth = new Map<string, number>();
  for (const r of monthlyCompletedResources) {
    const k = monthKey(r.updatedAt);
    completedByMonth.set(k, (completedByMonth.get(k) ?? 0) + 1);
  }

  const monthlyGrowth: MonthlyGrowthPoint[] = months.map((m) => ({
    month: m.label,
    learningHours: Math.round(((minutesByMonth.get(m.key) ?? 0) / 60) * 10) / 10,
    skillsImproved: skillIdsByMonth.get(m.key)?.size ?? 0,
    resourcesCompleted: completedByMonth.get(m.key) ?? 0,
  }));

  return { skills, learningResources, heatmap, monthlyGrowth };
}

async function assertOwnsSkill(userId: string, skillId: string) {
  const skill = await prisma.skill.findFirst({ where: { id: skillId, userId } });
  if (!skill) throw new NotFoundError("Skill not found.");
  return skill as { id: string; name: string; currentLevel: number };
}

async function assertOwnsResource(userId: string, resourceId: string) {
  const resource = await prisma.learningResource.findFirst({ where: { id: resourceId, userId } });
  if (!resource) throw new NotFoundError("Learning resource not found.");
  return resource as { id: string; status: string };
}

export async function listSkills(userId: string): Promise<SkillDetail[]> {
  const skillsRaw = (await prisma.skill.findMany({
    where: { userId },
    include: { history: { orderBy: { recordedAt: "asc" } } },
    orderBy: { currentLevel: "desc" },
  })) as SkillLike[];

  return skillsRaw.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    currentLevel: s.currentLevel,
    targetLevel: s.targetLevel,
    history: s.history.map((h) => ({ date: h.recordedAt.toISOString(), level: h.level, note: h.note })),
  }));
}

export async function addSkill(userId: string, input: AddSkillInput) {
  const skill = await prisma.skill.create({
    data: {
      userId,
      name: input.name,
      category: input.category,
      currentLevel: input.currentLevel,
      targetLevel: input.targetLevel,
      history: { create: [{ level: input.currentLevel }] },
    },
  });
  await prisma.activity.create({
    data: { userId, type: "SKILL_UPDATED", title: `Started tracking ${input.name}` },
  });
  return skill;
}

export async function updateSkill(userId: string, skillId: string, input: UpdateSkillInput) {
  const existing = await assertOwnsSkill(userId, skillId);

  const skill = await prisma.skill.update({
    where: { id: skillId },
    data: {
      ...(input.currentLevel !== undefined ? { currentLevel: input.currentLevel } : {}),
      ...(input.targetLevel !== undefined ? { targetLevel: input.targetLevel } : {}),
    },
  });

  if (input.currentLevel !== undefined && input.currentLevel !== existing.currentLevel) {
    await prisma.skillProgress.create({
      data: { skillId, level: input.currentLevel, note: input.note },
    });
    await prisma.activity.create({
      data: { userId, type: "SKILL_UPDATED", title: `Updated ${existing.name} to ${input.currentLevel}%` },
    });
  }

  return skill;
}

export async function deleteSkill(userId: string, skillId: string) {
  await assertOwnsSkill(userId, skillId);
  await prisma.skill.delete({ where: { id: skillId } });
}

export async function addLearningResource(userId: string, input: AddLearningResourceInput) {
  const resource = await prisma.learningResource.create({
    data: {
      userId,
      title: input.title,
      type: input.type,
      category: input.category,
      url: input.url || null,
    },
  });
  return resource;
}

export async function updateLearningResource(userId: string, resourceId: string, input: UpdateLearningResourceInput) {
  const existing = await assertOwnsResource(userId, resourceId);

  const resource = await prisma.learningResource.update({
    where: { id: resourceId },
    data: input,
  });

  if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await prisma.activity.create({
      data: { userId, type: "RESOURCE_COMPLETED", title: `Finished "${resource.title}"` },
    });
  }

  return resource;
}

export async function logLearningSession(userId: string, input: LogLearningSessionInput) {
  if (input.resourceId) {
    const resource = await assertOwnsResource(userId, input.resourceId);
    if (resource.status === "WANT_TO_LEARN") {
      await prisma.learningResource.update({ where: { id: input.resourceId }, data: { status: "LEARNING" } });
    }
  }

  const session = await prisma.learningSession.create({
    data: {
      userId,
      resourceId: input.resourceId,
      durationMinutes: input.durationMinutes,
      note: input.note,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
  });

  await prisma.activity.create({
    data: { userId, type: "LEARNING_SESSION_LOGGED", title: `Logged a ${input.durationMinutes}-minute learning session` },
  });

  return session;
}

const LEARNING_SORT: Record<ListLearningResourcesQuery["sort"], object[]> = {
  recent: [{ updatedAt: "desc" }],
  title: [{ title: "asc" }],
  rating: [{ rating: "desc" }, { updatedAt: "desc" }],
};

export async function listLearningResourcesFiltered(
  userId: string,
  query: ListLearningResourcesQuery
): Promise<LearningResourceDetail[]> {
  const [resourcesRaw, sessionAgg] = (await Promise.all([
    prisma.learningResource.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: LEARNING_SORT[query.sort],
    }),
    prisma.learningSession.groupBy({
      by: ["resourceId"],
      where: { userId },
      _sum: { durationMinutes: true },
      _count: { _all: true },
      _max: { occurredAt: true },
    }),
  ])) as [LearningResourceLike[], LearningSessionAggLike[]];

  const statsByResource = new Map(sessionAgg.filter((s) => s.resourceId).map((s) => [s.resourceId as string, s]));

  return resourcesRaw.map((r) => {
    const stats = statsByResource.get(r.id);
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      category: r.category,
      url: r.url,
      status: r.status,
      progress: r.progress,
      rating: r.rating,
      notes: r.notes,
      totalMinutes: stats?._sum.durationMinutes ?? 0,
      sessionCount: stats?._count._all ?? 0,
      lastSessionAt: stats?._max.occurredAt?.toISOString() ?? null,
    };
  });
}

export async function deleteLearningResource(userId: string, resourceId: string): Promise<void> {
  await assertOwnsResource(userId, resourceId);
  await prisma.learningResource.delete({ where: { id: resourceId } });
}

export interface LearningAnalytics {
  totalsByStatus: { status: string; count: number }[];
  totalsByType: { type: string; count: number }[];
  hoursByCategory: { category: string; hours: number }[];
  completionRate: number; // % of resources ever started that reached COMPLETED
  averageRating: number | null;
  sessionsLast7Days: number;
  sessionsLast30Days: number;
  totalLearningHours: number;
}

export async function getLearningAnalytics(userId: string): Promise<LearningAnalytics> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const [resources, ratedAgg, sessions7, sessions30, allSessionsAgg] = (await Promise.all([
    prisma.learningResource.findMany({ where: { userId }, select: { status: true, type: true, category: true, rating: true } }),
    prisma.learningResource.aggregate({ where: { userId, rating: { not: null } }, _avg: { rating: true } }),
    prisma.learningSession.count({ where: { userId, occurredAt: { gte: sevenDaysAgo } } }),
    prisma.learningSession.count({ where: { userId, occurredAt: { gte: thirtyDaysAgo } } }),
    prisma.learningSession.aggregate({ where: { userId }, _sum: { durationMinutes: true } }),
  ])) as [
    { status: string; type: string; category: string | null; rating: number | null }[],
    { _avg: { rating: number | null } },
    number,
    number,
    { _sum: { durationMinutes: number | null } }
  ];

  const statusCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  for (const r of resources) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
    typeCounts.set(r.type, (typeCounts.get(r.type) ?? 0) + 1);
  }

  const started = resources.filter((r) => r.status !== "WANT_TO_LEARN").length;
  const completed = resources.filter((r) => r.status === "COMPLETED").length;

  // Minutes-by-category requires joining sessions back to their resource's
  // category — done here rather than in the groupBy above since Prisma's
  // groupBy can't traverse a relation directly.
  const sessionsWithCategory = (await prisma.learningSession.findMany({
    where: { userId, resourceId: { not: null } },
    select: { durationMinutes: true, resource: { select: { category: true } } },
  })) as { durationMinutes: number; resource: { category: string | null } | null }[];

  const minutesByCategory = new Map<string, number>();
  for (const s of sessionsWithCategory) {
    const cat = s.resource?.category ?? "Uncategorized";
    minutesByCategory.set(cat, (minutesByCategory.get(cat) ?? 0) + s.durationMinutes);
  }

  return {
    totalsByStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
    totalsByType: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
    hoursByCategory: Array.from(minutesByCategory.entries()).map(([category, minutes]) => ({
      category,
      hours: Math.round((minutes / 60) * 10) / 10,
    })),
    completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
    averageRating: ratedAgg._avg.rating !== null ? Math.round(ratedAgg._avg.rating * 10) / 10 : null,
    sessionsLast7Days: sessions7,
    sessionsLast30Days: sessions30,
    totalLearningHours: Math.round(((allSessionsAgg._sum.durationMinutes ?? 0) / 60) * 10) / 10,
  };
}
