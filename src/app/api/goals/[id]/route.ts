import { getSessionUser } from "@/lib/auth/session";
import { updateGoal, deleteGoal, NotFoundError } from "@/server/services/goals";
import { updateGoalSchema } from "@/server/validation/goals";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const PATCH = withApiErrorHandling(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const goal = await updateGoal(user.id, params.id, parsed.data);
    return apiSuccess(goal);
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});

export const DELETE = withApiErrorHandling(async (_request: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  try {
    await deleteGoal(user.id, params.id);
    return apiSuccess({ deleted: true });
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});
