import { getSessionUser } from "@/lib/auth/session";
import { logLearningSession, NotFoundError } from "@/server/services/growth";
import { logLearningSessionSchema } from "@/server/validation/growth";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = logLearningSessionSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const session = await logLearningSession(user.id, parsed.data);
    return apiSuccess(session, 201);
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});
