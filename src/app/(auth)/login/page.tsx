"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/server/validation/auth";
import { postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await postJson("/api/auth/login", values);
      router.push(searchParams.get("next") ?? "/dashboard");
      router.refresh();
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-foreground/60">
          New to Pulse?{" "}
          <Link href="/signup" className="font-medium text-accent-blue hover:underline">
            Create a workspace
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="text-xs text-accent-coral">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-accent-blue hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-accent-coral">{errors.password.message}</p>}
        </div>

        {formError && (
          <p role="alert" className="rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-xs text-foreground/40">
        Demo login: demo@pulse.app / PulseDemo123!
      </p>
    </div>
  );
}
