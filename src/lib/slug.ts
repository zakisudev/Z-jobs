/**
 * Slugs appear in public, indexable URLs (`/jobs/[slug]`, `/companies/[slug]`),
 * so they must be stable once published and unique forever.
 */

/** Amharic and other non-Latin scripts collapse to nothing, hence the fallback. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");

  return base || "listing";
}

/** Short random suffix, using an alphabet without ambiguous glyphs. */
export function slugSuffix(length = 5): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

/**
 * `senior-backend-engineer-at-acme-x7f2k`
 *
 * The suffix makes collisions effectively impossible without a retry loop, and
 * keeps two identical job titles at the same company from fighting over one URL.
 */
export function jobSlug(title: string, companyName: string): string {
  return `${slugify(`${title}-at-${companyName}`)}-${slugSuffix()}`;
}
