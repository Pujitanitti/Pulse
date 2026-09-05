import { z } from "zod";
import { booleanQueryParam } from "@/server/validation/shared";

export const listSavedArticlesQuerySchema = z.object({
  folder: z.string().trim().max(60).optional(),
  favorite: booleanQueryParam(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["recent", "oldest", "title"]).default("recent"),
});
export type ListSavedArticlesQuery = z.infer<typeof listSavedArticlesQuerySchema>;

export const updateSavedArticleSchema = z.object({
  folder: z.string().trim().max(60).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  isFavorite: z.boolean().optional(),
});
export type UpdateSavedArticleInput = z.infer<typeof updateSavedArticleSchema>;
