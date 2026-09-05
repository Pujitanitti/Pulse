import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

/**
 * Wraps a Route Handler so any unexpected error (a database hiccup, a bug,
 * anything not already caught and turned into a proper apiError) becomes a
 * generic, safe JSON response instead of leaking internals — a raw Prisma
 * error message, a stack trace, or an unhandled-exception page — to the
 * client. The real error is still logged server-side for debugging; it
 * just never reaches the response body.
 */
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[api] unhandled error:", error);
      return apiError("Something went wrong. Please try again.", 500);
    }
  };
}
