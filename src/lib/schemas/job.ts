import { z } from "zod";
import { REGION_CODES } from "@/lib/constants/regions";

/**
 * Job and company validation, shared by the client form and the server action.
 *
 * The old app validated nothing on jobs: `company`, `website`, `status`, and
 * `salary` were free-text strings written straight to the database and rendered
 * back out. `website` in particular could hold `javascript:` and become a live
 * XSS vector the moment anything rendered it as a link.
 */

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
  "INTERNSHIP",
  "VOLUNTEER",
] as const;

export const WORKPLACE_TYPES = ["ONSITE", "HYBRID", "REMOTE"] as const;

export const EXPERIENCE_LEVELS = [
  "INTERN",
  "ENTRY",
  "JUNIOR",
  "MID",
  "SENIOR",
  "LEAD",
  "EXECUTIVE",
] as const;

export const SALARY_PERIODS = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

/** Only http(s). Blocks `javascript:` and `data:` URL schemes outright. */
const httpUrl = z
  .string()
  .trim()
  .max(255)
  .url("Enter a full URL, including https://")
  .refine((u) => /^https?:\/\//i.test(u), {
    message: "URL must start with http:// or https://",
  });

const optionalHttpUrl = httpUrl.optional().or(z.literal("").transform(() => undefined));

export const companyCreateSchema = z.object({
  name: z.string().trim().min(2, "Company name is required.").max(160),
  tagline: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  website: optionalHttpUrl,
  city: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  region: z
    .enum(REGION_CODES as [string, ...string[]])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  size: z
    .enum(["SIZE_1_10", "SIZE_11_50", "SIZE_51_200", "SIZE_201_500", "SIZE_500_PLUS"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  industrySlug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/** Salary is entered in whole birr and converted to santim at the boundary. */
const salaryMajor = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" ? undefined : Number(v)))
  .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0 && v <= 10_000_000), {
    message: "Enter a realistic salary amount.",
  })
  .optional();

export const jobInputSchema = z
  .object({
    title: z.string().trim().min(4, "Give the role a clear title.").max(160),
    description: z
      .string()
      .trim()
      .min(60, "Describe the role in at least a couple of sentences.")
      .max(20000),
    summary: z
      .string()
      .trim()
      .max(320)
      .optional()
      .or(z.literal("").transform(() => undefined)),

    employmentType: z.enum(EMPLOYMENT_TYPES),
    workplaceType: z.enum(WORKPLACE_TYPES),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    categorySlug: z.string().trim().min(1, "Choose a category."),

    city: z
      .string()
      .trim()
      .max(80)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    region: z
      .enum(REGION_CODES as [string, ...string[]])
      .optional()
      .or(z.literal("").transform(() => undefined)),

    salaryMin: salaryMajor,
    salaryMax: salaryMajor,
    salaryPeriod: z.enum(SALARY_PERIODS).default("MONTHLY"),
    salaryIsPublic: z.boolean().default(true),

    vacancies: z.coerce.number().int().min(1).max(999).default(1),
    applicationEmail: z
      .string()
      .trim()
      .email("Enter a valid email.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    expiresInDays: z.coerce.number().int().min(1).max(90).default(30),
  })
  .refine(
    (d) =>
      d.salaryMax === undefined ||
      d.salaryMin === undefined ||
      d.salaryMax >= d.salaryMin,
    {
      message: "Maximum salary must be at least the minimum.",
      path: ["salaryMax"],
    },
  )
  .refine((d) => d.workplaceType === "REMOTE" || Boolean(d.region), {
    message: "Choose a region, or set the workplace type to Remote.",
    path: ["region"],
  });

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type JobInput = z.infer<typeof jobInputSchema>;

/** Public search filters, parsed from URL search params. */
export const jobSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  region: z.string().trim().max(60).optional(),
  type: z.enum(EMPLOYMENT_TYPES).optional(),
  level: z.enum(EXPERIENCE_LEVELS).optional(),
  remote: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
});

export type JobSearchParams = z.infer<typeof jobSearchSchema>;

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z
    .string()
    .trim()
    .max(5000, "Keep your message under 5000 characters.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
