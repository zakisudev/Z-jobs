import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailToken } from "../_actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

/**
 * Consumes the token server-side on render.
 *
 * The old flow was `GET /api/users/verify?userId=3` — a sequential integer that
 * let anyone verify or enumerate any account, followed by a redirect hardcoded
 * to http://localhost:3000.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Panel
        ok={false}
        title="Missing verification link"
        body="This page needs a verification link from your email."
      />
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    return (
      <Panel
        ok={false}
        title="That link didn't work"
        body={result.error.message}
        action={{ href: "/verify-email/pending", label: "Send a new link" }}
      />
    );
  }

  return (
    <Panel
      ok
      title="Email confirmed"
      body="Your email address is verified. You can now post jobs and apply to vacancies."
      action={{ href: "/dashboard", label: "Go to dashboard" }}
    />
  );
}

function Panel({
  ok,
  title,
  body,
  action,
}: {
  ok: boolean;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="bg-card border-border rounded-lg border p-8 text-center shadow-sm">
      <Icon
        className={
          ok ? "text-success mx-auto size-12" : "text-destructive mx-auto size-12"
        }
        aria-hidden="true"
      />
      <h1 className="mt-4 text-xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{body}</p>
      {action && (
        <Button asChild className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
