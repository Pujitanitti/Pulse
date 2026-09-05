import { getSessionUser } from "@/lib/auth/session";
import { listFolders } from "@/server/services/library";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const GET = withApiErrorHandling(async () => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const folders = await listFolders(user.id);
  return apiSuccess(folders);
});
