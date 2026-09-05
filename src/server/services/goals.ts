import { prisma } from "@/lib/prisma";
import { calculateProgressFromMilestones } from "@/lib/goal-progress";
import type { CreateGoalInput, UpdateGoalInput, ListGoalsQuery, CreateMilestoneInput, UpdateMilestoneInput } from "@/server/validation/goals";

export class NotFoundError extends Error {}

interface MilestoneRow {
  id: string;
  title: string;
  completed: boolean;
  completedAt: Date | null;
  order: number;
}

interface GoalRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  deadline: Date | null;
  archivedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  milestones: MilestoneRow[];
}

export interface GoalView {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  deadline: string | null;
  archived: boolean;
  completedAt: string | null;
  milestones: { id: string; title: string; completed: boolean; order: number }[];
}

function toGoalView(g: GoalRow): GoalView {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    status: g.status,
    priority: g.priority,
    progress: g.progress,
    deadline: g.deadline?.toISOString() ?? null,
    archived: g.archivedAt !== null,
    completedAt: g.completedAt?.toISOString() ?? null,
    milestones: g.milestones
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ id: m.id, title: m.title, completed: m.completed, order: m.order })),
  };
}

const SORT_CLAUSES: Record<ListGoalsQuery["sort"], object[]> = {
  deadline: [{ deadline: "asc" }, { priority: "desc" }],
  priority: [{ priority: "desc" }, { deadline: "asc" }],
  newest: [{ createdAt: "desc" }],
};

export async function listGoals(userId: string, query: ListGoalsQuery): Promise<GoalView[]> {
  const goals = (await prisma.goal.findMany({
    where: {
      userId,
      archivedAt: query.archived ? { not: null } : null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    },
    include: { milestones: true },
    orderBy: SORT_CLAUSES[query.sort],
  })) as GoalRow[];

  return goals.map(toGoalView);
}

export async function createGoal(userId: string, input: CreateGoalInput): Promise<GoalView> {
  const goal = (await prisma.goal.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      milestones: input.milestones
        ? { create: input.milestones.map((title, i) => ({ title, order: i })) }
        : undefined,
    },
    include: { milestones: true },
  })) as GoalRow;

  await prisma.activity.create({
    data: { userId, type: "GOAL_CREATED", title: `Created goal "${input.title}"` },
  });

  return toGoalView(goal);
}

async function assertOwnsGoal(userId: string, goalId: string): Promise<{ id: string; title: string; status: string }> {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new NotFoundError("Goal not found.");
  return goal as { id: string; title: string; status: string };
}

/**
 * A single flexible PATCH covers edit, status change, mark-complete, and
 * archive/unarchive — rather than one endpoint per action — since all of
 * them are just field transitions on the same resource. Two transitions
 * get side effects: newly reaching COMPLETED sets completedAt + progress
 * 100 and logs an activity; leaving COMPLETED clears completedAt again so
 * the record doesn't lie about when (or whether) the goal was finished.
 */
export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput): Promise<GoalView> {
  const existing = await assertOwnsGoal(userId, goalId);

  const justCompleted = input.status === "COMPLETED" && existing.status !== "COMPLETED";
  const uncompleted = input.status !== undefined && input.status !== "COMPLETED" && existing.status === "COMPLETED";

  const [updated] = (await prisma.$transaction([
    prisma.goal.update({
      where: { id: goalId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        ...(input.deadline !== undefined ? { deadline: input.deadline ? new Date(input.deadline) : null } : {}),
        ...(input.progress !== undefined ? { progress: input.progress } : {}),
        ...(justCompleted ? { progress: 100, completedAt: new Date() } : {}),
        ...(uncompleted ? { completedAt: null } : {}),
        ...(input.archived === true ? { archivedAt: new Date() } : {}),
        ...(input.archived === false ? { archivedAt: null } : {}),
      },
      include: { milestones: true },
    }),
    ...(justCompleted
      ? [prisma.activity.create({ data: { userId, type: "GOAL_COMPLETED", title: `Completed goal "${existing.title}"` } })]
      : []),
  ])) as [GoalRow, ...unknown[]];

  return toGoalView(updated);
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  await assertOwnsGoal(userId, goalId);
  await prisma.goal.delete({ where: { id: goalId } });
}

/** Recomputes goal.progress from milestone completion ratio, if the goal has any milestones. */
async function recomputeProgressFromMilestones(goalId: string): Promise<void> {
  const milestones = (await prisma.goalMilestone.findMany({ where: { goalId }, select: { completed: true } })) as {
    completed: boolean;
  }[];
  const progress = calculateProgressFromMilestones(milestones);
  if (progress === null) return;
  await prisma.goal.update({ where: { id: goalId }, data: { progress } });
}

export async function addMilestone(userId: string, goalId: string, input: CreateMilestoneInput): Promise<GoalView> {
  await assertOwnsGoal(userId, goalId);
  const count = await prisma.goalMilestone.count({ where: { goalId } });
  await prisma.goalMilestone.create({ data: { goalId, title: input.title, order: count } });
  await recomputeProgressFromMilestones(goalId);

  const goal = (await prisma.goal.findUnique({ where: { id: goalId }, include: { milestones: true } })) as GoalRow;
  return toGoalView(goal);
}

/**
 * Toggling a milestone complete recomputes the parent goal's progress to
 * match the new completion ratio and — only on the false-to-true
 * transition — logs a MILESTONE_COMPLETED activity. Reaching 100% this way
 * does NOT auto-transition the goal's status to COMPLETED; that remains an
 * explicit action via updateGoal, since silently completing a goal the
 * user hasn't confirmed finishing would be surprising.
 */
export async function updateMilestone(
  userId: string,
  goalId: string,
  milestoneId: string,
  input: UpdateMilestoneInput
): Promise<GoalView> {
  const goal = await assertOwnsGoal(userId, goalId);
  const milestone = await prisma.goalMilestone.findFirst({ where: { id: milestoneId, goalId } });
  if (!milestone) throw new NotFoundError("Milestone not found.");

  const justCompleted = input.completed === true && !milestone.completed;

  await prisma.$transaction([
    prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: {
        title: input.title,
        ...(input.completed !== undefined
          ? { completed: input.completed, completedAt: input.completed ? new Date() : null }
          : {}),
      },
    }),
    ...(justCompleted
      ? [
          prisma.activity.create({
            data: { userId, type: "MILESTONE_COMPLETED", title: `Completed milestone "${milestone.title}" in "${goal.title}"` },
          }),
        ]
      : []),
  ]);

  await recomputeProgressFromMilestones(goalId);

  const updatedGoal = (await prisma.goal.findUnique({ where: { id: goalId }, include: { milestones: true } })) as GoalRow;
  return toGoalView(updatedGoal);
}

export async function deleteMilestone(userId: string, goalId: string, milestoneId: string): Promise<GoalView> {
  await assertOwnsGoal(userId, goalId);
  await prisma.goalMilestone.deleteMany({ where: { id: milestoneId, goalId } });
  await recomputeProgressFromMilestones(goalId);

  const goal = (await prisma.goal.findUnique({ where: { id: goalId }, include: { milestones: true } })) as GoalRow;
  return toGoalView(goal);
}
