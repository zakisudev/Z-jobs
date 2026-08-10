"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { applyToJob } from "./_actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClassName } from "@/components/forms/field";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Application sent",
  VIEWED: "Viewed by the employer",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview stage",
  OFFER: "Offer extended",
  HIRED: "Hired",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

/**
 * The apply panel handles four distinct states rather than one disabled button:
 * signed out, unverified, already applied, and ready. Each gets a specific next
 * action — a dead-end "you can't do this" is what made the old app's verify
 * gate so frustrating.
 */
export function ApplyPanel({
  jobId,
  jobTitle,
  isSignedIn,
  isVerified,
  existingStatus,
  slug,
}: {
  jobId: string;
  jobTitle: string;
  isSignedIn: boolean;
  isVerified: boolean;
  existingStatus: string | null;
  slug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [coverLetter, setCoverLetter] = useState("");

  if (existingStatus || submitted) {
    const label = existingStatus ? STATUS_LABEL[existingStatus] : "Application sent";
    return (
      <section
        className="border-success/40 bg-success-wash mt-10 flex items-start gap-3 rounded-xl border p-5"
        aria-live="polite"
      >
        <CheckCircle2
          className="text-success mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            You applied to {jobTitle}.{" "}
            <Link href="/dashboard/applications" className="text-primary hover:underline">
              Track your applications
            </Link>
          </p>
        </div>
      </section>
    );
  }

  if (!isSignedIn) {
    return (
      <section className="border-border bg-card mt-10 rounded-xl border p-6">
        <h2 className="display text-xl">Interested in this role?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a free account or sign in to apply. It takes under a minute.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="accent">
            <Link href={`/register?next=/jobs/${slug}`}>Create an account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/login?next=/jobs/${slug}`}>Sign in</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (!isVerified) {
    return (
      <section className="border-warning/40 bg-warning-wash mt-10 rounded-xl border p-6">
        <h2 className="display text-xl">Confirm your email to apply</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Employers need a working address to reply to you.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/verify-email/pending">Resend confirmation link</Link>
        </Button>
      </section>
    );
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const result = await applyToJob(jobId, coverLetter, slug);
      if (result.ok) {
        setSubmitted(true);
        toast.success("Application sent.");
      } else {
        setError(result.error.message);
        toast.error(result.error.message);
      }
    });
  }

  return (
    <section className="border-border bg-card mt-10 rounded-xl border p-6">
      <h2 className="display text-xl">Apply for this job</h2>

      <div className="mt-4 space-y-4">
        <FormError message={error} />

        <Field
          label="Message to the employer"
          name="coverLetter"
          hint="Optional, but applications with a short note get read first."
        >
          {(props) => (
            <textarea
              {...props}
              rows={5}
              maxLength={5000}
              value={coverLetter}
              onChange={(e) => {
                setCoverLetter(e.target.value);
              }}
              placeholder="Why you're a good fit for this role…"
              className={inputClassName}
            />
          )}
        </Field>

        <Button
          variant="accent"
          size="lg"
          onClick={submit}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
          {pending ? "Sending…" : "Submit application"}
        </Button>
      </div>
    </section>
  );
}
