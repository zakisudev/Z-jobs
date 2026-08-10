import { Badge, type BadgeProps } from "@/components/ui/badge";

/**
 * The two status vocabularies the employer console speaks, in one place.
 *
 * They were previously inline `Record<string, string>` maps duplicated across
 * the jobs list and the applicant card, built from opacity fills like
 * `bg-success/10`. Two problems that fixes: the same status rendered a
 * different colour depending on the surface behind it, and the two files had
 * already drifted — `SHORTLISTED`, `INTERVIEW`, `OFFER`, and `HIRED` were all
 * mapped to four different opacities of the same green, which reads as one
 * undifferentiated blob exactly where the pipeline needs to be legible.
 */

const JOB_TONE: Record<string, BadgeProps["tone"]> = {
  PUBLISHED: "success",
  DRAFT: "neutral",
  CLOSED: "neutral",
  EXPIRED: "warning",
  PENDING_REVIEW: "warning",
  REJECTED: "danger",
};

/** Sentence case, not SCREAMING_SNAKE, and not `.toLowerCase()` either —
 *  "pending review" mid-sentence is fine, but as a badge it wants a capital. */
function humanize(status: string): string {
  const words = status.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function JobStatusBadge({ status }: { status: string }) {
  return <Badge tone={JOB_TONE[status] ?? "neutral"}>{humanize(status)}</Badge>;
}

/**
 * Colour marks the KIND of state, not the individual stage — the label already
 * names the stage, and five near-identical greens would only make the label do
 * the work twice.
 *
 *   primary  still live, needs the employer to act or respond
 *   neutral  seen or closed by the candidate, no decision pending
 *   accent   an offer is out — the one stage with money attached
 *   success  hired
 *   danger   rejected
 */
const APPLICATION_TONE: Record<string, BadgeProps["tone"]> = {
  SUBMITTED: "primary",
  VIEWED: "neutral",
  SHORTLISTED: "primary",
  INTERVIEW: "primary",
  OFFER: "accent",
  HIRED: "success",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  return <Badge tone={APPLICATION_TONE[status] ?? "neutral"}>{humanize(status)}</Badge>;
}

/** Ordered pipeline stages, used for the applicant summary counts. */
export const PIPELINE_STAGES = [
  { value: "SUBMITTED", label: "New" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Hired" },
] as const;
