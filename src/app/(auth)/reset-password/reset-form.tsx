"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { resetPassword, type FormState } from "../_actions";
import { Field, FormError, inputClassName } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<FormState<{ done: true }>, FormData>(
    resetPassword,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const summary =
    state && !state.ok && !state.error.fieldErrors ? state.error.message : undefined;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <FormError message={summary} />

      <Field
        label="New password"
        name="password"
        required
        hint="At least 10 characters."
        error={fieldErrors?.password}
      >
        {(props) => (
          <input
            {...props}
            type="password"
            autoComplete="new-password"
            className={inputClassName}
          />
        )}
      </Field>

      <Field
        label="Confirm new password"
        name="confirmPassword"
        required
        error={fieldErrors?.confirmPassword}
      >
        {(props) => (
          <input
            {...props}
            type="password"
            autoComplete="new-password"
            className={inputClassName}
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}
