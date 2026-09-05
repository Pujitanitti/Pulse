import { getSessionUser } from "@/lib/auth/session";
import { updateMilestone, deleteMilestone, NotFoundError } from "@/server/services/goals";
import { updateMilestoneSchema } from "@/server/validation/goals";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const PATCH = withApiErrorHandling(async (request: Request, { params }: { params: { id: string; milestoneId: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const goal = await updateMilestone(user.id, params.id, params.milestoneId, parsed.data);
    return apiSuccess(goal);
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});

export const DELETE = withApiErrorHandling(async (_request: Request, { params }: { params: { id: string; milestoneId: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  try {
    const goal = await deleteMilestone(user.id, params.id, params.milestoneId);
    return apiSuccess(goal);
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});
