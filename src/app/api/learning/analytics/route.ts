import { getSessionUser } from "@/lib/auth/session";
import { getLearningAnalytics } from "@/server/services/growth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async () => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const data = await getLearningAnalytics(user.id);
  return apiSuccess(data);
});
