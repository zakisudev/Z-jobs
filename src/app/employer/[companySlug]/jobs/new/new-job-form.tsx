"use client";

import { createAndPublishJob } from "@/app/employer/_actions";
import { JobForm } from "@/components/job/job-form";

export function NewJobForm({ companySlug }: { companySlug: string }) {
  // The slug is bound here rather than carried in a hidden field, so it cannot
  // be swapped client-side to target another company. The server still
  // re-checks membership via requireCompany regardless.
  const action = createAndPublishJob.bind(null, companySlug);
  return <JobForm action={action} />;
}
