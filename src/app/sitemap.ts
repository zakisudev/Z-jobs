import type { MetadataRoute } from "next";
import { listPublicSlugs as jobSlugs } from "@/server/repos/job.repo";
import { listPublicSlugs as companySlugs } from "@/server/repos/company.repo";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { env } from "@/lib/env";

/**
 * Google Jobs indexing requires the sitemap, so this is not optional for a job
 * board. Only PUBLISHED, unexpired jobs appear — the repo's `publicWhere`
 * guarantees that, which keeps expired listings out of the index.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL;

  const [jobs, companies] = await Promise.all([jobSlugs(), companySlugs()]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/companies`, changeFrequency: "weekly", priority: 0.6 },

    ...JOB_CATEGORIES.map((c) => ({
      url: `${base}/jobs?category=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),

    ...jobs.map((j) => ({
      url: `${base}/jobs/${j.slug}`,
      lastModified: j.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),

    ...companies.map((c) => ({
      url: `${base}/companies/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
