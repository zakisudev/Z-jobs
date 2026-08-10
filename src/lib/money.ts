/**
 * Money is Int in MINOR UNITS (santim) everywhere in the app and database.
 * Floats never touch a currency value.
 */

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function toMajor(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number, currency = "ETB"): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(toMajor(minor));
}

const PERIOD_LABEL: Record<string, string> = {
  HOURLY: "hour",
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
};

/**
 * Renders a salary band for a job card or detail page. Returns null when the
 * employer chose not to publish salary, so callers can omit the row entirely
 * rather than printing a misleading "0".
 */
export function formatSalaryRange(job: {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  salaryIsPublic: boolean;
}): string | null {
  if (!job.salaryIsPublic || job.salaryMin === null) return null;

  const period = PERIOD_LABEL[job.salaryPeriod] ?? "month";
  const min = formatMoney(job.salaryMin, job.salaryCurrency);

  if (job.salaryMax === null || job.salaryMax === job.salaryMin) {
    return `${min} / ${period}`;
  }

  return `${min} – ${formatMoney(job.salaryMax, job.salaryCurrency)} / ${period}`;
}
