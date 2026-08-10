"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login, type FormState } from "../_actions";
import { Field, FormError, inputClassName } from "@/components/forms/field";
import { Button } from "@/components/ui/button";

/**
 * The submit button owns its own pending state via useFormStatus.
 *
 * The old form REPLACED the button with a spinner image while loading, which
 * shifted the layout and made its own `disabled={isLoading}` unreachable — the
 * button only rendered when isLoading was already false, so double submits were
 * never actually prevented.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<FormState<{ id: string }>, FormData>(
    login,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  // Field-level errors render on the field; anything else goes to the summary.
  const summary =
    state && !state.ok && !state.error.fieldErrors ? state.error.message : undefined;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

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

      <Field label="Password" name="password" required error={fieldErrors?.password}>
        {(props) => (
          <input
            {...props}
            type="password"
            autoComplete="current-password"
            className={inputClassName}
          />
        )}
      </Field>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-primary text-sm font-medium hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <SubmitButton />
    </form>
  );
}
