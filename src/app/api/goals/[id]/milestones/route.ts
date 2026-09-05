import { getSessionUser } from "@/lib/auth/session";
import { addMilestone, NotFoundError } from "@/server/services/goals";
import { createMilestoneSchema } from "@/server/validation/goals";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async (request: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) return apiError("Not authenticated.", 401);

  const body = await request.json().catch(() => null);
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const goal = await addMilestone(user.id, params.id, parsed.data);
    return apiSuccess(goal, 201);
  } catch (e) {
    if (e instanceof NotFoundError) return apiError(e.message, 404);
    throw e;
  }
});
