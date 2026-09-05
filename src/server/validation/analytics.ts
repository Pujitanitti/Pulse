import { z } from "zod";

export const analyticsRangeSchema = z.enum(["7", "30", "90", "365"]).default("30");
export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;
