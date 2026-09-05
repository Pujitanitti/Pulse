import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/server/validation/auth";
import { apiError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { withApiErrorHandling } from "@/lib/api-handler";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const limit = rateLimit(`reset-password:${clientIp(request.headers)}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return apiError("Too many attempts. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  const invalid = () => apiError("This reset link is invalid or has expired.", 400);

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return invalid();
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // A password reset is a strong signal the account may have been
  // compromised (or the old password simply forgotten) — either way,
  // every existing session should be forced to re-authenticate.
  await destroyAllSessionsForUser(resetToken.userId);

  return apiSuccess({ message: "Password updated. You can now log in." });
});
