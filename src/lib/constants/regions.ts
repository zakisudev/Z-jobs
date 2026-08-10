/**
 * Ethiopian first-level administrative divisions, current after the 2023
 * reorganisation of the former SNNPR.
 *
 * `code` is what lands in `Job.region` / `Company.region` and appears in the
 * `/jobs-in/[region]` SEO URLs, so these strings are a public contract —
 * renaming one breaks indexed links. Add new entries; don't rename old ones.
 */
export const ET_REGIONS = [
  { code: "addis-ababa", name: "Addis Ababa", nameAm: "አዲስ አበባ" },
  { code: "afar", name: "Afar", nameAm: "አፋር" },
  { code: "amhara", name: "Amhara", nameAm: "አማራ" },
  { code: "benishangul-gumuz", name: "Benishangul-Gumuz", nameAm: "ቤንሻንጉል ጉሙዝ" },
  { code: "central-ethiopia", name: "Central Ethiopia", nameAm: "ማዕከላዊ ኢትዮጵያ" },
  { code: "dire-dawa", name: "Dire Dawa", nameAm: "ድሬ ዳዋ" },
  { code: "gambela", name: "Gambela", nameAm: "ጋምቤላ" },
  { code: "harari", name: "Harari", nameAm: "ሐረሪ" },
  { code: "oromia", name: "Oromia", nameAm: "ኦሮሚያ" },
  { code: "sidama", name: "Sidama", nameAm: "ሲዳማ" },
  { code: "somali", name: "Somali", nameAm: "ሶማሊ" },
  { code: "south-ethiopia", name: "South Ethiopia", nameAm: "ደቡብ ኢትዮጵያ" },
  { code: "south-west-ethiopia", name: "South West Ethiopia", nameAm: "ደቡብ ምዕራብ ኢትዮጵያ" },
  { code: "tigray", name: "Tigray", nameAm: "ትግራይ" },
] as const;

export type RegionCode = (typeof ET_REGIONS)[number]["code"];

export const REGION_CODES = ET_REGIONS.map((r) => r.code);

const REGION_BY_CODE = new Map(ET_REGIONS.map((r) => [r.code as string, r]));

export function getRegion(code: string | null | undefined) {
  return code ? REGION_BY_CODE.get(code) : undefined;
}

export function isRegionCode(value: string): value is RegionCode {
  return REGION_BY_CODE.has(value);
}
