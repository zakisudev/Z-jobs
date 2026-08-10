"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { forgotPassword, type FormState } from "../_actions";
import { Field, FormError, inputClassName } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<FormState<{ message: string }>, FormData>(
    forgotPassword,
    null,
  );

  /**
   * On success we show the same generic confirmation regardless of whether the
   * address exists. Anything else turns this form into an account-discovery
   * tool: submit an email, learn whether it is registered.
   */
  if (state?.ok) {
    return (
      <p
        role="status"
        className="border-success/30 bg-success/10 text-success mt-6 rounded-md border px-3 py-3 text-sm"
      >
        {state.data.message}
      </p>
    );
  }

  // `state` is narrowed to the failure branch by the early return above.
  const fieldErrors = state?.error.fieldErrors;
  const summary = state && !fieldErrors ? state.error.message : undefined;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <FormError message={summary} />

      <Field label="Email" name="email" required error={fieldErrors?.email}>
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            className={inputClassName}
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}
