import { z } from "zod";
import { booleanQueryParam } from "@/server/validation/shared";

export const GOAL_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED"] as const;
export const GOAL_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, "Title is too short.").max(120),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(GOAL_PRIORITIES).default("MEDIUM"),
  deadline: z.string().datetime().optional(),
  milestones: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
});
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(GOAL_STATUSES).optional(),
  priority: z.enum(GOAL_PRIORITIES).optional(),
  deadline: z.string().datetime().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  archived: z.boolean().optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const listGoalsQuerySchema = z.object({
  status: z.enum(GOAL_STATUSES).optional(),
  priority: z.enum(GOAL_PRIORITIES).optional(),
  archived: booleanQueryParam(false),
  sort: z.enum(["deadline", "priority", "newest"]).default("deadline"),
});
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  completed: z.boolean().optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
