import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireVerified } from "@/server/auth/guard";
import { listForUser } from "@/server/repos/membership.repo";
import { Eyebrow } from "@/components/ui/section";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = {
  title: "Create your company",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const ctx = await requireVerified("/employer/onboarding");

  // Already has a company: skip straight to it rather than creating a second.
  const memberships = await listForUser(ctx.user.id);
  if (memberships.length > 0 && memberships[0]) {
    redirect(`/employer/${memberships[0].company.slug}/jobs`);
  }

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <Eyebrow>Step 1 of 2</Eyebrow>
      <h1 className="display text-display-sm mt-4">Set up your company</h1>
      <p className="text-muted-foreground mt-3 max-w-prose text-sm leading-relaxed">
        This is what candidates see on your job listings — the name, the mark, and the
        verification status they judge a vacancy by. You can change all of it later.
      </p>
      <div className="mt-10">
        <CompanyForm />
      </div>
    </main>
  );
}
