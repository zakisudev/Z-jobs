import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Globe, MapPin, BadgeCheck } from "lucide-react";
import { findPublicBySlug } from "@/server/repos/company.repo";
import { listPublicForCompany } from "@/server/repos/job.repo";
import { getRegion } from "@/lib/constants/regions";
import { JobCard } from "@/components/job/job-card";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await findPublicBySlug(slug);
  if (!company) return { title: "Company not found", robots: { index: false } };

  return {
    title: `${company.name} — jobs and company profile`,
    description:
      company.tagline ?? `Open roles at ${company.name}. Apply directly on Z-Jobs.`,
    alternates: { canonical: `/companies/${company.slug}` },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await findPublicBySlug(slug);
  if (!company) notFound();

  const jobs = await listPublicForCompany(company.id);

  const region = getRegion(company.region);
  const location = [company.city, region?.name].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {company.name}
          </h1>
          {company.verification === "VERIFIED" && (
            <BadgeCheck className="text-primary size-5" aria-label="Verified employer" />
          )}
        </div>
        {company.tagline && (
          <p className="text-muted-foreground mt-1">{company.tagline}</p>
        )}

        <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden="true" />
              {location}
            </span>
          )}
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              // noopener/noreferrer on any user-supplied outbound link: without
              // it the target page gets a handle on this window via opener.
              rel="noopener noreferrer nofollow"
              className="hover:text-foreground flex items-center gap-1"
            >
              <Globe className="size-4" aria-hidden="true" />
              Website
            </a>
          )}
        </div>
      </header>

      {company.description && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
            {company.description}
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Open roles {jobs.length > 0 && `(${jobs.length})`}
        </h2>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No open vacancies right now.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
