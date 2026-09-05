import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status = 400, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error: { message, fieldErrors } }, { status });
}

export function apiValidationError(error: ZodError) {
  return apiError("Please check the highlighted fields.", 422, error.flatten().fieldErrors as Record<string, string[]>);
}
