import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Keep it under 72 characters.") // bcrypt silently truncates beyond this
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v), "Mix upper and lower case letters.")
  .refine((v) => /\d/.test(v), "Include at least one number.");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
