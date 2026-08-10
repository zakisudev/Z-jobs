import { z } from "zod";

/**
 * Shared validation. These objects must NOT import anything server-side —
 * the same schema drives `zodResolver` in the browser and re-validation on the
 * server, so a client-side bypass changes nothing.
 */

/** Top passwords seen in credential-stuffing lists, plus local favourites. */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "iloveyou",
  "welcome1",
  "admin123",
  "letmein123",
  "abc123456",
  "ethiopia1",
  "addisababa",
  "changeme1",
]);

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(191, "That email is too long.")
  .email("Enter a valid email address.")
  .transform((v) => v.toLowerCase());

/**
 * Minimum 10 characters, up from the old app's 6 — which accepted "123456".
 *
 * The 72-byte ceiling is not cosmetic: argon2 has no such limit, but keeping it
 * documents the boundary and stops absurd payloads. Strength is checked against
 * a common-password list rather than a character-class rule, because
 * "Password1!" satisfies every class rule and is trivially guessed.
 */
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.")
  .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), {
    message: "That password is too common. Choose something less predictable.",
  })
  .refine((v) => new Set(v).size >= 4, {
    message: "That password is too repetitive.",
  });

const nameSchema = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(80, "That name is too long.");

/** Ethiopian mobile numbers: +2519…/+2517… or local 09…/07…. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+251|0)(9|7)\d{8}$/, "Enter a valid Ethiopian phone number.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    /** Branches onboarding: seekers land on /dashboard, employers on /onboarding. */
    role: z.enum(["SEEKER", "EMPLOYER"]),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue." }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    // Attaching to the field means the error renders on the input, not as a
    // detached line under the submit button as it did before.
    path: ["confirmPassword"],
  })
  .refine((d) => !d.password.toLowerCase().includes(d.email.split("@")[0] ?? ""), {
    message: "Your password must not contain your email address.",
    path: ["password"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  // Deliberately NOT passwordSchema: an existing account may predate a policy
  // change, and echoing strength rules on login leaks the policy to attackers.
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({ token: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
