import type { Metadata } from "next";
import Link from "next/link";
import { Building2, BadgeCheck } from "lucide-react";
import { listHiringCompanies } from "@/server/repos/company.repo";
import { getRegion } from "@/lib/constants/regions";
import { EmptyState } from "@/components/data/empty-state";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Companies hiring in Ethiopia",
  description:
    "Browse employers currently hiring on Z-Jobs and see their open vacancies.",
  alternates: { canonical: "/companies" },
};

export default async function CompaniesPage() {
  const companies = await listHiringCompanies();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Companies hiring</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Employers with open vacancies right now.
      </p>

      {companies.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Building2}
          title="No companies hiring yet"
          description="Employers appear here once they publish their first vacancy."
          action={{ href: "/register?role=EMPLOYER", label: "Post a job" }}
        />
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {companies.map((company) => {
            const region = getRegion(company.region);
            return (
              <li key={company.id}>
                <Link
                  href={`/companies/${company.slug}`}
                  className="border-border hover:border-primary/40 block rounded-lg border p-4"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{company.name}</span>
                    {company.verification === "VERIFIED" && (
                      <BadgeCheck
                        className="text-primary size-4"
                        aria-label="Verified employer"
                      />
                    )}
                  </div>
                  {company.tagline && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {company.tagline}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2 text-xs">
                    {company._count.jobs} open{" "}
                    {company._count.jobs === 1 ? "role" : "roles"}
                    {region && ` · ${region.name}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
