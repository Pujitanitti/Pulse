import { getSessionUser } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async () => {
  const user = await getSessionUser();
  return apiSuccess({ user });
});
