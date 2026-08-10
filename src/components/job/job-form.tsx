"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/app/(auth)/_actions";
import {
  Field,
  FormError,
  FormSection,
  Select,
  inputClassName,
} from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { ET_REGIONS } from "@/lib/constants/regions";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import {
  EMPLOYMENT_TYPES,
  WORKPLACE_TYPES,
  EXPERIENCE_LEVELS,
  SALARY_PERIODS,
} from "@/lib/schemas/job";

const LABELS: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
  ONSITE: "On site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
  INTERN: "Intern",
  ENTRY: "Entry level",
  JUNIOR: "Junior",
  MID: "Mid level",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
  HOURLY: "per hour",
  DAILY: "per day",
  WEEKLY: "per week",
  MONTHLY: "per month",
  YEARLY: "per year",
};

export type JobFormDefaults = Partial<{
  title: string;
  description: string;
  summary: string;
  employmentType: string;
  workplaceType: string;
  experienceLevel: string;
  categorySlug: string;
  city: string;
  region: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: string;
  salaryIsPublic: boolean;
  vacancies: string;
  applicationEmail: string;
}>;

/**
 * The submit bar sticks to the bottom of the viewport.
 *
 * This form is long enough to scroll several screens, and the publish control
 * previously sat only at the very bottom — an employer who scrolled back up to
 * check a field had to scroll all the way down again to submit.
 */
function SubmitButtons({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="border-border bg-background/90 sticky bottom-0 -mx-4 mt-10 flex flex-wrap gap-2 border-t px-4 py-4 backdrop-blur-md sm:mx-0 sm:px-0">
      <Button
        type="submit"
        name="publish"
        value="true"
        variant="accent"
        disabled={pending}
        aria-busy={pending}
      >
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isEdit ? "Save changes" : "Publish job"}
      </Button>
      {!isEdit && (
        <Button
          type="submit"
          name="publish"
          value="false"
          variant="outline"
          disabled={pending}
        >
          Save as draft
        </Button>
      )}
    </div>
  );
}

export function JobForm({
  action,
  defaults,
  isEdit = false,
}: {
  action: (
    prev: FormState<{ slug: string }>,
    formData: FormData,
  ) => Promise<FormState<{ slug: string }>>;
  defaults?: JobFormDefaults;
  isEdit?: boolean;
}) {
  const [state, formAction] = useActionState<FormState<{ slug: string }>, FormData>(
    action,
    null,
  );
  // Region is only required when the role isn't remote, so the field toggles.
  const [workplace, setWorkplace] = useState(defaults?.workplaceType ?? "ONSITE");

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const summary =
    state && !state.ok && !state.error.fieldErrors ? state.error.message : undefined;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormError message={summary} />

      <div className="space-y-5">
        <Field label="Job title" name="title" required error={fieldErrors?.title}>
          {(props) => (
            <input
              {...props}
              type="text"
              defaultValue={defaults?.title}
              placeholder="e.g. Senior Backend Engineer"
              className={inputClassName}
            />
          )}
        </Field>

        <Field
          label="Short summary"
          name="summary"
          hint="One or two lines shown on job cards and in search results."
          error={fieldErrors?.summary}
        >
          {(props) => (
            <input
              {...props}
              type="text"
              maxLength={320}
              defaultValue={defaults?.summary}
              className={inputClassName}
            />
          )}
        </Field>

        <Field
          label="Job description"
          name="description"
          required
          hint="Responsibilities, requirements, and what you offer. This is what Google indexes."
          error={fieldErrors?.description}
        >
          {(props) => (
            <textarea
              {...props}
              rows={12}
              defaultValue={defaults?.description}
              className={inputClassName}
            />
          )}
        </Field>
      </div>

      <FormSection
        title="Classification"
        description="How candidates find this role when they filter the board."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Category"
            name="categorySlug"
            required
            error={fieldErrors?.categorySlug}
          >
            {(props) => (
              <Select {...props} defaultValue={defaults?.categorySlug ?? ""}>
                <option value="">Select a category</option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Employment type"
            name="employmentType"
            required
            error={fieldErrors?.employmentType}
          >
            {(props) => (
              <Select {...props} defaultValue={defaults?.employmentType ?? "FULL_TIME"}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LABELS[t]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Experience level"
            name="experienceLevel"
            required
            error={fieldErrors?.experienceLevel}
          >
            {(props) => (
              <Select {...props} defaultValue={defaults?.experienceLevel ?? "MID"}>
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LABELS[l]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Number of openings"
            name="vacancies"
            error={fieldErrors?.vacancies}
          >
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={defaults?.vacancies ?? "1"}
                className={inputClassName}
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Location">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field
            label="Workplace"
            name="workplaceType"
            required
            error={fieldErrors?.workplaceType}
          >
            {(props) => (
              <Select
                {...props}
                value={workplace}
                onChange={(e) => {
                  setWorkplace(e.target.value);
                }}
              >
                {WORKPLACE_TYPES.map((w) => (
                  <option key={w} value={w}>
                    {LABELS[w]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="City" name="city" error={fieldErrors?.city}>
            {(props) => (
              <input
                {...props}
                type="text"
                defaultValue={defaults?.city}
                className={inputClassName}
              />
            )}
          </Field>

          <Field
            label="Region"
            name="region"
            required={workplace !== "REMOTE"}
            error={fieldErrors?.region}
          >
            {(props) => (
              <Select {...props} defaultValue={defaults?.region ?? ""}>
                <option value="">
                  {workplace === "REMOTE" ? "Not required" : "Select a region"}
                </option>
                {ET_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Pay"
        description="Listings that show a salary get significantly more applicants. Amounts in ETB."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Minimum" name="salaryMin" error={fieldErrors?.salaryMin}>
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={defaults?.salaryMin}
                className={inputClassName}
              />
            )}
          </Field>

          <Field label="Maximum" name="salaryMax" error={fieldErrors?.salaryMax}>
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={defaults?.salaryMax}
                className={inputClassName}
              />
            )}
          </Field>

          <Field label="Period" name="salaryPeriod" error={fieldErrors?.salaryPeriod}>
            {(props) => (
              <Select {...props} defaultValue={defaults?.salaryPeriod ?? "MONTHLY"}>
                {SALARY_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {LABELS[p]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <label
          htmlFor="salaryIsPublic"
          className="border-border bg-sunken flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm"
        >
          <input
            id="salaryIsPublic"
            type="checkbox"
            name="salaryIsPublic"
            defaultChecked={defaults?.salaryIsPublic ?? true}
            className="accent-primary size-4 shrink-0"
          />
          Show the salary publicly
        </label>
      </FormSection>

      <FormSection title="Listing">
        <Field
          label="Listing duration"
          name="expiresInDays"
          hint="Days before the listing expires. Maximum 90."
          error={fieldErrors?.expiresInDays}
        >
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              defaultValue="30"
              className={`${inputClassName} sm:max-w-40`}
            />
          )}
        </Field>
      </FormSection>

      <SubmitButtons isEdit={isEdit} />
    </form>
  );
}
