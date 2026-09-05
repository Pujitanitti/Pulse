import { z } from "zod";

export const dashboardRangeSchema = z.enum(["7", "30", "90", "365"]).default("30");
export type DashboardRange = z.infer<typeof dashboardRangeSchema>;
