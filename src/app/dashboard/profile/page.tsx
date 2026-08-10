import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { EmptyState } from "@/components/data/empty-state";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const ctx = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          What employers see when you apply.
        </p>
      </div>

      <dl className="border-border bg-card divide-border divide-y rounded-lg border">
        <Row label="Name" value={`${ctx.user.firstName} ${ctx.user.lastName}`} />
        <Row label="Email" value={ctx.user.email} />
        <Row label="Email confirmed" value={ctx.user.emailVerified ? "Yes" : "Not yet"} />
      </dl>

      <EmptyState
        icon={UserRound}
        title="Your profile is incomplete"
        description="Adding a headline, skills, and work history makes your applications far more likely to be shortlisted."
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <dt className="text-muted-foreground w-40 shrink-0 text-sm">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
