"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@prisma/client";
import { action } from "@/server/action";
import { z } from "zod";
import { companyCreateSchema, jobInputSchema } from "@/lib/schemas/job";
import * as companies from "@/server/repos/company.repo";
import * as jobService from "@/server/services/job.service";
import * as applicationService from "@/server/services/application.service";
import type { ActionResult } from "@/lib/errors";
import type { FormState } from "@/app/(auth)/_actions";
import { formValue } from "@/lib/form";

const createCompanyAction = action({
  input: companyCreateSchema,
  auth: "verified",
  handler: async (input, ctx) => {
    const company = await companies.createWithOwner({
      ownerUserId: ctx.user.id,
      ...input,
    });
    return { slug: company.slug };
  },
});

export async function createCompany(
  _prev: FormState<{ slug: string }>,
  formData: FormData,
): Promise<FormState<{ slug: string }>> {
  const v = (k: string) => formValue(formData, k);

  const result = await createCompanyAction({
    name: v("name"),
    tagline: v("tagline"),
    description: v("description"),
    website: v("website"),
    city: v("city"),
    region: v("region"),
    size: v("size"),
    industrySlug: v("industrySlug"),
  });

  if (!result.ok) return result;
  redirect(`/employer/${result.data.slug}/jobs`);
}

// ─────────────────────────────── jobs ───────────────────────────────

const jobFormSchema = jobInputSchema.and(z.object({ companySlug: z.string().min(1) }));

const createJobAction = action({
  input: jobFormSchema,
  auth: { company: ["OWNER", "ADMIN", "RECRUITER"], slugFrom: (i) => i.companySlug },
  handler: (input, ctx) => jobService.createDraft(ctx, input),
});

const updateJobAction = action({
  input: jobFormSchema.and(z.object({ jobId: z.string().min(1) })),
  auth: { company: ["OWNER", "ADMIN", "RECRUITER"], slugFrom: (i) => i.companySlug },
  handler: (input, ctx) => jobService.update(ctx, input.jobId, input),
});

const publishJobAction = action({
  input: z.object({
    companySlug: z.string().min(1),
    jobId: z.string().min(1),
    expiresInDays: z.coerce.number().int().min(1).max(90).default(30),
  }),
  auth: { company: ["OWNER", "ADMIN", "RECRUITER"], slugFrom: (i) => i.companySlug },
  rateLimit: { name: "publishJob", by: (_i, ctx) => ctx.companyId },
  handler: (input, ctx) => jobService.publish(ctx, input.jobId, input.expiresInDays),
});

const closeJobAction = action({
  input: z.object({ companySlug: z.string().min(1), jobId: z.string().min(1) }),
  auth: { company: ["OWNER", "ADMIN"], slugFrom: (i) => i.companySlug },
  handler: (input, ctx) => jobService.close(ctx, input.jobId),
});

function readJobForm(formData: FormData, companySlug: string) {
  const v = (k: string) => formValue(formData, k);
  return {
    companySlug,
    title: v("title"),
    description: v("description"),
    summary: v("summary"),
    employmentType: v("employmentType"),
    workplaceType: v("workplaceType"),
    experienceLevel: v("experienceLevel"),
    categorySlug: v("categorySlug"),
    city: v("city"),
    region: v("region"),
    salaryMin: v("salaryMin"),
    salaryMax: v("salaryMax"),
    salaryPeriod: v("salaryPeriod") || "MONTHLY",
    salaryIsPublic: formData.get("salaryIsPublic") === "on",
    vacancies: v("vacancies") || "1",
    applicationEmail: v("applicationEmail"),
    expiresInDays: v("expiresInDays") || "30",
  };
}

/**
 * Create-and-publish in one submit. Splitting it into "save draft" then
 * "publish" doubles the steps for the common case; the draft state still exists
 * for anyone who wants it via the Save draft button.
 */
export async function createAndPublishJob(
  companySlug: string,
  _prev: FormState<{ slug: string }>,
  formData: FormData,
): Promise<FormState<{ slug: string }>> {
  const input = readJobForm(formData, companySlug);
  const created = await createJobAction(input);
  if (!created.ok) return created;

  const publishNow = formData.get("publish") === "true";
  if (!publishNow) {
    revalidatePath(`/employer/${companySlug}/jobs`);
    redirect(`/employer/${companySlug}/jobs`);
  }

  const published = await publishJobAction({
    companySlug,
    jobId: created.data.id,
    expiresInDays: input.expiresInDays,
  });

  // Quota rejection leaves a usable draft rather than losing the work.
  if (!published.ok) return published;

  revalidatePath("/jobs");
  revalidatePath(`/employer/${companySlug}/jobs`);
  redirect(`/employer/${companySlug}/jobs?published=${created.data.slug}`);
}

export async function updateJob(
  companySlug: string,
  jobId: string,
  _prev: FormState<{ slug: string }>,
  formData: FormData,
): Promise<FormState<{ slug: string }>> {
  const result = await updateJobAction({ ...readJobForm(formData, companySlug), jobId });
  if (!result.ok) return result;

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${result.data.slug}`);
  redirect(`/employer/${companySlug}/jobs`);
}

export async function publishJob(
  companySlug: string,
  jobId: string,
): Promise<ActionResult<{ slug: string }>> {
  const result = await publishJobAction({ companySlug, jobId, expiresInDays: 30 });
  if (result.ok) {
    revalidatePath("/jobs");
    revalidatePath(`/employer/${companySlug}/jobs`);
  }
  return result.ok ? { ok: true, data: { slug: result.data.slug } } : result;
}

export async function closeJob(companySlug: string, jobId: string) {
  const result = await closeJobAction({ companySlug, jobId });
  if (result.ok) {
    revalidatePath("/jobs");
    revalidatePath(`/employer/${companySlug}/jobs`);
  }
  return result;
}

// ─────────────────────────── applications ───────────────────────────

const changeStatusAction = action({
  input: z.object({
    companySlug: z.string().min(1),
    applicationId: z.string().min(1),
    status: z.enum(["VIEWED", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
  }),
  auth: { company: ["OWNER", "ADMIN", "RECRUITER"], slugFrom: (i) => i.companySlug },
  handler: (input, ctx) =>
    applicationService.changeStatus(
      ctx,
      input.applicationId,
      input.status as ApplicationStatus,
    ),
});

export async function changeApplicationStatus(
  companySlug: string,
  applicationId: string,
  status: string,
) {
  const result = await changeStatusAction({ companySlug, applicationId, status });
  if (result.ok) revalidatePath(`/employer/${companySlug}/applicants`);
  return result;
}
