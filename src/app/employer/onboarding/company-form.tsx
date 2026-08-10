"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { createCompany } from "../_actions";
import type { FormState } from "@/app/(auth)/_actions";
import { Field, FormError, Select, inputClassName } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { ET_REGIONS } from "@/lib/constants/regions";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

const SIZES = [
  { value: "SIZE_1_10", label: "1–10 employees" },
  { value: "SIZE_11_50", label: "11–50 employees" },
  { value: "SIZE_51_200", label: "51–200 employees" },
  { value: "SIZE_201_500", label: "201–500 employees" },
  { value: "SIZE_500_PLUS", label: "500+ employees" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" full disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending ? "Creating…" : "Create company"}
    </Button>
  );
}

export function CompanyForm() {
  const [state, formAction] = useActionState<FormState<{ slug: string }>, FormData>(
    createCompany,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const summary =
    state && !state.ok && !state.error.fieldErrors ? state.error.message : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={summary} />

      <Field label="Company name" name="name" required error={fieldErrors?.name}>
        {(props) => (
          <input
            {...props}
            type="text"
            autoComplete="organization"
            className={inputClassName}
          />
        )}
      </Field>

      <Field
        label="Tagline"
        name="tagline"
        hint="One line describing what your company does."
        error={fieldErrors?.tagline}
      >
        {(props) => <input {...props} type="text" className={inputClassName} />}
      </Field>

      <Field label="Website" name="website" error={fieldErrors?.website}>
        {(props) => (
          <input
            {...props}
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            autoComplete="url"
            className={inputClassName}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="City" name="city" error={fieldErrors?.city}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="address-level2"
              className={inputClassName}
            />
          )}
        </Field>

        <Field label="Region" name="region" error={fieldErrors?.region}>
          {(props) => (
            <Select {...props} defaultValue="">
              <option value="">Select a region</option>
              {ET_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Industry" name="industrySlug" error={fieldErrors?.industrySlug}>
          {(props) => (
            <Select {...props} defaultValue="">
              <option value="">Select an industry</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Company size" name="size" error={fieldErrors?.size}>
          {(props) => (
            <Select {...props} defaultValue="">
              <option value="">Select a size</option>
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field
        label="About the company"
        name="description"
        hint="Shown on your company page and every job listing."
        error={fieldErrors?.description}
      >
        {(props) => <textarea {...props} rows={5} className={inputClassName} />}
      </Field>

      <SubmitButton />
    </form>
  );
}
