import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="display text-display-sm">Reset your password</h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>

      <ForgotPasswordForm />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remembered it?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
