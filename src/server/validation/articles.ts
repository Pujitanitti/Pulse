import { z } from "zod";

export const ARTICLE_CATEGORIES = [
  "TECHNOLOGY",
  "AI",
  "STARTUPS",
  "SOFTWARE_ENGINEERING",
  "PRODUCT",
  "BUSINESS",
  "DESIGN",
  "CYBERSECURITY",
] as const;

export const articleListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.enum(ARTICLE_CATEGORIES).optional(),
  sort: z.enum(["newest", "oldest", "quickest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;
