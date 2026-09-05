"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/server/validation/auth";
import { postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState<{ message: string; devResetUrl?: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    try {
      const data = await postJson<{ message: string; devResetUrl?: string }>(
        "/api/auth/forgot-password",
        values
      );
      setSent(data);
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-foreground/60">{sent.message}</p>
        {sent.devResetUrl && (
          <p className="rounded-md bg-surface px-3 py-2 text-xs text-foreground/60">
            Dev mode only — no email service is configured locally. Reset link:{" "}
            <Link href={sent.devResetUrl} className="break-all font-medium text-accent-blue hover:underline">
              {sent.devResetUrl}
            </Link>
          </p>
        )}
        <Link href="/login" className="inline-block text-sm text-accent-blue hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-foreground/60">
          Enter the email on your account and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="text-xs text-accent-coral">{errors.email.message}</p>}
        </div>

        {formError && (
          <p role="alert" className="rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>

        <Link href="/login" className="block text-center text-sm text-foreground/60 hover:underline">
          Back to login
        </Link>
      </form>
    </div>
  );
}
