"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/server/validation/auth";
import { postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    try {
      await postJson("/api/auth/signup", values);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      const err = e as Error & { fieldErrors?: Record<string, string[]> };
      if (err.fieldErrors) {
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          setError(field as keyof SignupInput, { message: messages[0] });
        }
      } else {
        setFormError(err.message);
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-blue hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="text-xs text-accent-coral">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="text-xs text-accent-coral">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
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
          {isSubmitting ? "Creating your workspace…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
