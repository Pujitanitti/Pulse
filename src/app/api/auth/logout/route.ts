import { destroyCurrentSession } from "@/lib/auth/session";
import { apiSuccess } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async () => {
  await destroyCurrentSession();
  return apiSuccess({ ok: true });
});
