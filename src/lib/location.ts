import { getRegion } from "@/lib/constants/regions";

/**
 * One place that turns a job's location fields into a display string.
 *
 * The de-duplication is the point. Addis Ababa and Dire Dawa are chartered
 * cities — they are their own region — so a job there has `city: "Addis Ababa"`
 * and `region: "addis-ababa"`, and naively joining the two rendered
 * "Addis Ababa, Addis Ababa" on every card in the capital. That is the highest
 * job-density location on the board, so the worst possible place for it.
 */
export function formatJobLocation(job: {
  isRemote: boolean;
  city: string | null;
  region: string | null;
}): string {
  if (job.isRemote) return "Remote";

  const regionName = getRegion(job.region)?.name;
  const city = job.city?.trim() || null;

  if (city && regionName && city.toLowerCase() !== regionName.toLowerCase()) {
    return `${city}, ${regionName}`;
  }

  return city ?? regionName ?? "Ethiopia";
}
