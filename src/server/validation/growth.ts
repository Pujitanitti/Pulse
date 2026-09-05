import { z } from "zod";

export const addSkillSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(60),
  category: z.string().trim().max(40).optional(),
  currentLevel: z.number().int().min(0).max(100).default(0),
  targetLevel: z.number().int().min(1).max(100).default(100),
});
export type AddSkillInput = z.infer<typeof addSkillSchema>;

export const updateSkillSchema = z.object({
  currentLevel: z.number().int().min(0).max(100).optional(),
  targetLevel: z.number().int().min(1).max(100).optional(),
  note: z.string().trim().max(280).optional(),
});
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

export const LEARNING_RESOURCE_TYPES = ["COURSE", "BOOK", "ARTICLE", "TUTORIAL", "DOCUMENTATION", "VIDEO"] as const;
export const LEARNING_STATUSES = ["WANT_TO_LEARN", "LEARNING", "COMPLETED"] as const;

export const addLearningResourceSchema = z.object({
  title: z.string().trim().min(2, "Title is too short.").max(160),
  type: z.enum(LEARNING_RESOURCE_TYPES),
  category: z.string().trim().max(40).optional(),
  url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
});
export type AddLearningResourceInput = z.infer<typeof addLearningResourceSchema>;

export const updateLearningResourceSchema = z.object({
  status: z.enum(LEARNING_STATUSES).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdateLearningResourceInput = z.infer<typeof updateLearningResourceSchema>;

export const listLearningResourcesQuerySchema = z.object({
  status: z.enum(LEARNING_STATUSES).optional(),
  type: z.enum(LEARNING_RESOURCE_TYPES).optional(),
  sort: z.enum(["recent", "title", "rating"]).default("recent"),
});
export type ListLearningResourcesQuery = z.infer<typeof listLearningResourcesQuerySchema>;

export const logLearningSessionSchema = z.object({
  resourceId: z.string().cuid().optional(),
  durationMinutes: z.number().int().min(1).max(600),
  note: z.string().trim().max(280).optional(),
  occurredAt: z.string().datetime().optional(),
});
export type LogLearningSessionInput = z.infer<typeof logLearningSessionSchema>;
