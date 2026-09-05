import { z } from "zod";

export const globalSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Enter a search term.").max(200),
});
export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
