import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/guard";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a free Z-Jobs account to apply for jobs or post vacancies in Ethiopia.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  if (await getAuth()) redirect("/dashboard");

  const params = await searchParams;
  const initialRole = params.role === "EMPLOYER" ? "EMPLOYER" : "SEEKER";

  return (
    <div>
      <h1 className="display text-display-sm">Create your account</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        It takes less than a minute.
      </p>

      <RegisterForm initialRole={initialRole} />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
