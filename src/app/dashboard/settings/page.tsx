import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { ThemeToggle } from "@/components/theme";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const ctx = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and preferences.
        </p>
      </div>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a colour theme, or follow your device setting.
        </p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </section>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Account</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Signed in as{" "}
          <span className="text-foreground font-medium">{ctx.user.email}</span>
        </p>
        <Link
          href="/forgot-password"
          className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
        >
          Change password
        </Link>
      </section>
    </div>
  );
}
