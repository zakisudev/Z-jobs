import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { ResendButton } from "./resend-button";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyPendingPage() {
  const ctx = await requireUser();

  return (
    <div className="text-center">
      <MailCheck className="text-primary mx-auto size-12" aria-hidden="true" />
      <h1 className="display mt-5 text-3xl">Check your inbox</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        We sent a confirmation link to{" "}
        <span className="text-foreground font-medium">{ctx.user.email}</span>. The link
        expires in 24 hours.
      </p>

      {/* The old app's unverified state was a dead end: "Please verify your
          email to use this feature" with no resend and no link. */}
      <ResendButton />

      <p className="text-muted-foreground mt-4 text-xs">
        Can&apos;t find it? Check your spam folder.
      </p>
    </div>
  );
}
