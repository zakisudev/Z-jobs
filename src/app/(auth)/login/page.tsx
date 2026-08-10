import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/guard";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  if (await getAuth()) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div>
      <h1 className="display text-display-sm">Welcome back</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        Sign in to continue to your account.
      </p>

      {params.reset === "success" && (
        <p
          role="status"
          className="border-success/40 bg-success-wash text-success mt-5 rounded-md border px-3.5 py-2.5 text-sm"
        >
          Your password was reset. Sign in with your new password.
        </p>
      )}

      <LoginForm next={params.next ?? ""} />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
