"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { ET_REGIONS } from "@/lib/constants/regions";
import { EMPLOYMENT_TYPES } from "@/lib/schemas/job";
import { Button } from "@/components/ui/button";
import { formValue } from "@/lib/form";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

/**
 * Filters live in the URL, not component state: results become shareable and
 * linkable, the back button behaves, and the server component can render the
 * filtered list directly without a client round trip.
 */
export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // any filter change invalidates the current page
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasFilters = ["q", "category", "region", "type", "remote"].some((k) =>
    params.get(k),
  );

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setParam("q", formValue(data, "q"));
        }}
        className="flex gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <label htmlFor="job-search" className="sr-only">
            Search jobs by keyword
          </label>
          <input
            id="job-search"
            name="q"
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder="Job title, skill, or company"
            className="border-border-strong bg-card focus:border-primary h-10 w-full rounded-md border pr-3 pl-10 text-sm transition-colors outline-none"
          />
        </div>
        <Button type="submit" className="shrink-0">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Category"
          value={params.get("category") ?? ""}
          onChange={(v) => {
            setParam("category", v);
          }}
          options={JOB_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
        />
        <Select
          label="Region"
          value={params.get("region") ?? ""}
          onChange={(v) => {
            setParam("region", v);
          }}
          options={ET_REGIONS.map((r) => ({ value: r.code, label: r.name }))}
        />
        <Select
          label="Job type"
          value={params.get("type") ?? ""}
          onChange={(v) => {
            setParam("type", v);
          }}
          options={EMPLOYMENT_TYPES.map((t) => ({
            value: t,
            label: TYPE_LABEL[t] ?? t,
          }))}
        />

        {/* A pressed toggle rather than a checkbox: it is the only boolean
            here, and as a pill it matches the selects instead of dropping a
            lone native checkbox into the row. */}
        <Toggle
          pressed={params.get("remote") === "true"}
          onToggle={(next) => {
            setParam("remote", next ? "true" : "");
          }}
        >
          Remote only
        </Toggle>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.push(pathname);
            }}
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function Toggle({
  pressed,
  onToggle,
  children,
}: {
  pressed: boolean;
  onToggle: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => {
        onToggle(!pressed);
      }}
      className={cn(
        "h-9 rounded-md border px-3 text-sm font-medium transition-colors",
        pressed
          ? "border-primary bg-primary-wash text-primary"
          : "border-border-strong bg-card text-muted-foreground hover:border-primary hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A native <select> kept native — it gets the platform picker on mobile, which
 * is faster to operate one-handed than any custom listbox and needs no
 * keyboard handling of our own. Only the chrome is restyled.
 */
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const active = value !== "";

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={cn(
          "h-9 appearance-none rounded-md border py-0 pr-9 pl-3 text-sm font-medium transition-colors outline-none",
          active
            ? "border-primary bg-primary-wash text-primary"
            : "border-border-strong bg-card text-muted-foreground hover:border-primary",
        )}
      >
        <option value="">{label}: any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2",
          active ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
    </div>
  );
}
