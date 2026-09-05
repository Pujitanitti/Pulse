import { requireUser } from "@/lib/auth/require-user";
import { listGoals } from "@/server/services/goals";
import { listGoalsQuerySchema } from "@/server/validation/goals";
import { GoalsBoard } from "@/components/goals/goals-board";

export default async function GoalsPage() {
  const user = await requireUser();
  const initial = await listGoals(user.id, listGoalsQuerySchema.parse({}));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="text-sm text-foreground/50">Set direction, track milestones, and see what&apos;s next.</p>
      </div>
      <GoalsBoard initial={initial} />
    </div>
  );
}
