import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAnalyticsData } from "@/server/services/analytics";
import { analyticsRangeSchema } from "@/server/validation/analytics";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const rangeParam = request.nextUrl.searchParams.get("range") ?? "30";
  const parsed = analyticsRangeSchema.safeParse(rangeParam);
  const rangeDays = Number(parsed.success ? parsed.data : "30");

  const data = await getAnalyticsData(user.id, rangeDays);
  return apiSuccess(data);
});
