import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="display text-3xl">Invalid reset link</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          This page needs a reset link from your email.
        </p>
        <Link
          href="/forgot-password"
          className="text-primary mt-6 inline-block text-sm font-medium hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display text-display-sm">Choose a new password</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        You&apos;ll be signed out everywhere else once it&apos;s changed.
      </p>

      <ResetPasswordForm token={token} />
    </div>
  );
}
