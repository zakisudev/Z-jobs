"use server";

import { revalidatePath } from "next/cache";
import { action } from "@/server/action";
import { applicationSchema } from "@/lib/schemas/job";
import * as applicationService from "@/server/services/application.service";
import type { ActionResult } from "@/lib/errors";

const applyAction = action({
  input: applicationSchema,
  // `verified`, not `user`: an unconfirmed address must not be able to apply,
  // or employers receive applications they cannot reply to.
  auth: "verified",
  // ctx is always present under "verified" auth.
  rateLimit: { name: "applyToJob", by: (_i, ctx) => ctx.user.id },
  handler: (input, ctx) =>
    applicationService.apply(ctx, {
      jobId: input.jobId,
      coverLetter: input.coverLetter,
    }),
});

export async function applyToJob(
  jobId: string,
  coverLetter: string,
  slug: string,
): Promise<ActionResult<{ id: string; jobTitle: string }>> {
  const result = await applyAction({ jobId, coverLetter });

  if (result.ok) {
    // The detail page shows applicant count and the applied state.
    revalidatePath(`/jobs/${slug}`);
    revalidatePath("/dashboard/applications");
  }

  return result;
}
