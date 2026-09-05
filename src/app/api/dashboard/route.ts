import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDashboardData } from "@/server/services/dashboard";
import { dashboardRangeSchema } from "@/server/validation/dashboard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const rangeParam = request.nextUrl.searchParams.get("range") ?? "30";
  const parsed = dashboardRangeSchema.safeParse(rangeParam);
  const rangeDays = Number(parsed.success ? parsed.data : "30");

  const data = await getDashboardData(user.id, rangeDays);
  return apiSuccess(data);
});
