"use server";

import { redirect } from "next/navigation";
import { action } from "@/server/action";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/lib/schemas/auth";
import * as auth from "@/server/services/auth.service";
import { destroySession } from "@/server/auth/session";
import { getAuth } from "@/server/auth/guard";
import { MESSAGES, type ActionResult } from "@/lib/errors";
import { formValue } from "@/lib/form";

/**
 * Auth server actions. Each is a thin adapter: the `action()` wrapper owns
 * validation, rate limiting, and error shaping, and the service owns behaviour.
 */

const registerAction = action({
  input: registerSchema,
  auth: "public",
  rateLimit: { name: "register", by: (_i, _c, ip) => ip },
  handler: async (input) => {
    const user = await auth.register({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
      role: input.role,
    });
    return { role: user.role };
  },
});

const loginAction = action({
  input: loginSchema,
  auth: "public",
  // Keyed on both, so one attacker cannot lock out an entire office behind a
  // shared IP, and a botnet cannot spread attempts across many addresses.
  rateLimit: { name: "login", by: (input, _c, ip) => `${ip}:${input.email}` },
  handler: (input) => auth.login(input),
});

const forgotPasswordAction = action({
  input: forgotPasswordSchema,
  auth: "public",
  rateLimit: {
    name: "passwordResetRequest",
    by: (input, _c, ip) => `${ip}:${input.email}`,
  },
  handler: async (input) => {
    await auth.requestPasswordReset(input.email);
    // Always the same response — see requestPasswordReset for why.
    return { message: MESSAGES.GENERIC_RESET };
  },
});

const resetPasswordAction = action({
  input: resetPasswordSchema,
  auth: "public",
  handler: async (input) => {
    await auth.resetPassword(input.token, input.password);
    return { done: true as const };
  },
});

const verifyEmailAction = action({
  input: verifyEmailSchema,
  auth: "public",
  handler: async (input) => {
    const user = await auth.verifyEmail(input.token);
    return { email: user.email };
  },
});

/** Shape expected by `useActionState`. */
export type FormState<T> = ActionResult<T> | null;

export async function register(
  _prev: FormState<{ role: string }>,
  formData: FormData,
): Promise<FormState<{ role: string }>> {
  const result = await registerAction({
    firstName: formValue(formData, "firstName"),
    lastName: formValue(formData, "lastName"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
    role: formValue(formData, "role") || "SEEKER",
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!result.ok) return result;

  // Employers need a company before anything else; seekers go straight in.
  redirect(result.data.role === "EMPLOYER" ? "/employer/onboarding" : "/dashboard");
}

export async function login(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  const next = formValue(formData, "next");
  const result = await loginAction({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });

  if (!result.ok) return result;

  /**
   * Only allow relative paths. Taking `next` straight from the query string
   * would make this an open redirect — an attacker could send
   * /login?next=https://evil.example and harvest the post-login click.
   */
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(safeNext);
}

export async function forgotPassword(
  _prev: FormState<{ message: string }>,
  formData: FormData,
): Promise<FormState<{ message: string }>> {
  return forgotPasswordAction({ email: formValue(formData, "email") });
}

export async function resetPassword(
  _prev: FormState<{ done: true }>,
  formData: FormData,
): Promise<FormState<{ done: true }>> {
  const result = await resetPasswordAction({
    token: formValue(formData, "token"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
  });

  if (!result.ok) return result;
  redirect("/login?reset=success");
}

export async function verifyEmailToken(token: string) {
  return verifyEmailAction({ token });
}

export async function resendVerification(): Promise<ActionResult<{ sent: true }>> {
  const ctx = await getAuth();
  if (!ctx)
    return { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in first." } };
  if (ctx.user.emailVerified) return { ok: true, data: { sent: true } };

  await auth.sendVerificationEmail({
    id: ctx.user.id,
    email: ctx.user.email,
    firstName: ctx.user.firstName,
  });

  return { ok: true, data: { sent: true } };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
