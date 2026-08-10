import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/server/auth/guard";
import { Eyebrow } from "@/components/ui/section";
import { NewJobForm } from "./new-job-form";

export const metadata: Metadata = {
  title: "Post a job",
  robots: { index: false, follow: false },
};

export default async function NewJobPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  await requireCompany(companySlug);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/employer/${companySlug}/jobs`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All jobs
      </Link>

      <Eyebrow className="mt-6">New listing</Eyebrow>
      <h1 className="display text-display-sm mt-4">Post a job</h1>
      <p className="text-muted-foreground mt-3 mb-10 max-w-prose text-sm leading-relaxed">
        Your listing goes live immediately, appears on the public board, and is indexed by
        search engines including Google Jobs.
      </p>

      <NewJobForm companySlug={companySlug} />
    </div>
  );
}
