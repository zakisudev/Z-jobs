import { z } from "zod";
import { companyCreateSchema } from "./job";

/**
 * Editing a company takes exactly the fields creating one does — keeping them
 * as one schema means the onboarding form and the profile form cannot drift
 * into accepting different things.
 */
export const companyProfileSchema = companyCreateSchema;

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

/**
 * Ethiopian TIN: ten digits. It appears on invoices, so it is validated here
 * rather than at print time, when the mistake is expensive to correct.
 */
export const companySettingsSchema = z.object({
  tin: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "A TIN is 10 digits.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/**
 * OWNER is absent on purpose. Ownership transfers by promoting an existing
 * member, never by emailing an invitation — otherwise a mistyped address
 * hands control of the tenant to a stranger who only has to click a link.
 */
export const INVITABLE_ROLES = ["ADMIN", "RECRUITER"] as const;

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(INVITABLE_ROLES),
});

export const memberRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "RECRUITER"]),
});

/** Labels for the three roles, with what each one may actually do. */
export const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  RECRUITER: "Recruiter",
};

export const ROLE_DESCRIPTION: Record<string, string> = {
  OWNER: "Full control, including billing and deleting the company.",
  ADMIN: "Manage jobs, applicants, the team, and the company profile.",
  RECRUITER: "Post jobs and move applicants through the pipeline.",
};
