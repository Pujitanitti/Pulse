"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { resetPasswordSchema } from "@/server/validation/auth";
import { postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const formSchema = resetPasswordSchema.omit({ token: true });
type FormInput = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema) });

  async function onSubmit(values: FormInput) {
    setFormError(null);
    try {
      await postJson("/api/auth/reset-password", { ...values, token });
      setDone(true);
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="text-sm text-foreground/60">
          This reset link is missing its token. Request a new one from the login page.
        </p>
        <Link href="/forgot-password" className="text-sm text-accent-blue hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
        <p className="text-sm text-foreground/60">
          Your password has been changed and any other active sessions have been signed out.
        </p>
        <Button onClick={() => router.push("/login")} className="w-full">
          Log in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-accent-coral">{errors.password.message}</p>}
          <p className="text-xs text-foreground/40">8+ characters, upper &amp; lower case, at least one number.</p>
        </div>

        {formError && (
          <p role="alert" className="rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
