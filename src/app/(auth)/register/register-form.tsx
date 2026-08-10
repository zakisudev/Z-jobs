"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, User, Building2 } from "lucide-react";
import { register, type FormState } from "../_actions";
import { Field, FormError, inputClassName } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

/**
 * Role chooser as a radiogroup rather than a select: it is the single most
 * consequential decision on this form (it branches onboarding entirely), so it
 * gets visual weight. Native radio inputs keep keyboard and screen-reader
 * behaviour correct for free.
 */
function RoleChooser({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { value: "SEEKER", label: "I'm looking for a job", icon: User },
    { value: "EMPLOYER", label: "I'm hiring", icon: Building2 },
  ];

  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 block text-sm font-medium">I want to…</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.value;
          const id = `role-${opt.value.toLowerCase()}`;
          return (
            <div key={opt.value}>
              {/* Explicit id/htmlFor rather than an implicit wrapping label:
                  the association survives the visually-hidden input, which is
                  what screen readers and jsx-a11y both need to see. */}
              <input
                id={id}
                type="radio"
                name="role"
                value={opt.value}
                checked={selected}
                onChange={() => {
                  onChange(opt.value);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-3 text-sm transition-colors",
                  "peer-focus-visible:outline-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function RegisterForm({ initialRole }: { initialRole: string }) {
  const [role, setRole] = useState(initialRole);
  const [state, formAction] = useActionState<FormState<{ role: string }>, FormData>(
    register,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const summary =
    state && !state.ok && !state.error.fieldErrors ? state.error.message : undefined;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <FormError message={summary} />

      <RoleChooser value={role} onChange={setRole} />

      {/* Stacks on mobile; the old register form was a fixed h-96 that clipped
          its own inputs. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          required
          error={fieldErrors?.firstName}
        >
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="given-name"
              className={inputClassName}
            />
          )}
        </Field>

        <Field label="Last name" name="lastName" required error={fieldErrors?.lastName}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="family-name"
              className={inputClassName}
            />
          )}
        </Field>
      </div>

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

      <Field
        label="Password"
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
        label="Confirm password"
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

      <div className="space-y-1.5">
        <label htmlFor="acceptTerms" className="flex items-start gap-2 text-sm">
          <input
            id="acceptTerms"
            type="checkbox"
            name="acceptTerms"
            className="border-input mt-0.5 size-4 shrink-0 rounded"
            aria-describedby={fieldErrors?.acceptTerms ? "accept-terms-error" : undefined}
            aria-invalid={Boolean(fieldErrors?.acceptTerms)}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {fieldErrors?.acceptTerms?.[0] && (
          <p
            id="accept-terms-error"
            role="alert"
            className="text-destructive text-xs font-medium"
          >
            {fieldErrors.acceptTerms[0]}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
