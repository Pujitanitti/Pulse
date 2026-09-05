import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { forgotPasswordSchema } from "@/server/validation/auth";
import { apiSuccess, apiValidationError, apiError } from "@/lib/api-response";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { withApiErrorHandling } from "@/lib/api-handler";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const limit = rateLimit(`forgot-password:${clientIp(request.headers)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return apiError("Too many requests. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return the same success response whether or not the email is
  // registered — this is what actually prevents account enumeration via
  // this endpoint (a different message per branch would leak it).
  const genericResponse = apiSuccess({
    message: "If that email has an account, a reset link is on its way.",
  });

  if (!user) return genericResponse;

  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${request.nextUrl.origin}/reset-password?token=${rawToken}`;

  // No email provider is wired up for local dev (the spec requires zero
  // paid services). In production this would hand off to a transactional
  // email service; for now the link is logged server-side, and — only in
  // development — echoed back in the response so the flow is testable
  // end-to-end without an inbox.
  console.log(`[Pulse] Password reset link for ${email}: ${resetUrl}`);

  return apiSuccess({
    message: "If that email has an account, a reset link is on its way.",
    ...(process.env.NODE_ENV === "development" ? { devResetUrl: resetUrl } : {}),
  });
});
