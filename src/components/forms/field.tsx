"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The single input wrapper every form field goes through.
 *
 * It exists to make the old app's accessibility failures impossible rather than
 * merely discouraged. Previously every input in Login, Register, and the job
 * modals used a placeholder as its only label: the field name vanished as soon
 * as the user typed, screen readers announced nothing, and password managers
 * had no autoComplete hint to fill from.
 *
 * Guaranteed here for every field:
 *   - a real <label htmlFor> bound to the input id
 *   - aria-invalid when errored
 *   - aria-describedby covering BOTH the hint and the error
 *   - role="alert" on the error so it is announced, not just displayed
 */

/**
 * Must be React's useId, not a module-level counter: a counter restarts on the
 * client, so the ids generated during SSR and during hydration diverge and the
 * label stops pointing at its input. useId is stable across both.
 */
function useFieldId(provided?: string) {
  const generated = React.useId();
  return provided ?? generated;
}

type FieldProps = {
  label: string;
  name: string;
  id?: string;
  hint?: string;
  error?: string[] | undefined;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    name: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
    required: boolean;
  }) => React.ReactNode;
};

export function Field({
  label,
  name,
  id: providedId,
  hint,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const id = useFieldId(providedId);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error?.length ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* The required asterisk is a CSS pseudo-element, not a child node.
          As real markup it lands inside the label's text content, making the
          accessible name "Password*" instead of "Password" — screen readers
          announce the glyph, and any name-based query has to match it too. */}
      <label
        htmlFor={id}
        data-required={required || undefined}
        className="field-label block text-sm font-medium"
      >
        {label}
        {!required && (
          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
            (optional)
          </span>
        )}
      </label>

      {children({
        id,
        name,
        "aria-invalid": Boolean(error?.length),
        "aria-describedby": describedBy,
        required,
      })}

      {hint && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}

      {error?.length ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName =
  "border-input bg-card w-full rounded-md border px-3.5 py-2.5 text-sm " +
  "transition-colors outline-none " +
  "placeholder:text-muted-foreground " +
  "focus:border-primary " +
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20 aria-[invalid=true]:ring-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

/**
 * A native <select> with the app's chrome.
 *
 * Native is deliberate: it gets the platform picker on mobile, which beats any
 * custom listbox one-handed and needs no keyboard handling of our own. Only
 * `appearance-none` plus our own chevron is added, because the default arrow
 * does not follow the border colour and looked pasted on.
 *
 * The wrapper is a plain span so the render-prop props (id, aria-*, required)
 * still land on the select itself rather than on a div.
 */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={cn(inputClassName, "appearance-none pr-10", className)}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </span>
  );
}

/**
 * A titled group of fields, separated by a rule rather than boxed.
 *
 * A long form broken into nested bordered panels turns into a stack of cards
 * inside a card; a hairline and a label carry the same grouping with none of
 * the visual weight. Replaces the `<fieldset>` box the salary group used.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-border border-t pt-8">
      <legend className="sr-only">{title}</legend>
      <p className="eyebrow" aria-hidden="true">
        {title}
      </p>
      {description && (
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">{description}</p>
      )}
      <div className="mt-6 space-y-5">{children}</div>
    </fieldset>
  );
}

/**
 * Summary shown above a form after a failed submit. Screen-reader users
 * otherwise get no indication that anything went wrong — the old forms rendered
 * a single unassociated string below the submit button with no aria-live.
 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive-wash text-destructive rounded-md border px-3.5 py-2.5 text-sm"
    >
      {message}
    </div>
  );
}
