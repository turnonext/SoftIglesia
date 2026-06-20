import { z } from "zod";

export const loginSchema = z.object({
  tenant_slug: z.string().min(2, "Cliente requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const registerSchema = loginSchema.extend({
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: "Las contraseñas no coinciden",
  path: ["password_confirmation"],
});

export const forgotPasswordSchema = z.object({
  tenant_slug: z.string().min(2),
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  tenant_slug: z.string().min(2),
  email: z.string().email(),
  token: z.string().min(32),
  password: z.string().min(8),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: "Las contraseñas no coinciden",
  path: ["password_confirmation"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
