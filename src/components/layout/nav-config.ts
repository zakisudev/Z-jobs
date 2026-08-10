import {
  LayoutDashboard,
  FileText,
  Bookmark,
  Bell,
  UserRound,
  Settings,
  Briefcase,
  Users,
  Building2,
  CreditCard,
  ShieldCheck,
  Receipt,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

/**
 * Nav manifests. One `AppShell` renders all three areas; only the manifest and
 * the base path differ.
 *
 * `primary: true` marks the (at most three) destinations that also appear in
 * the mobile bottom tab bar. More than three and the targets get too small to
 * hit reliably one-handed.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  /** Exact match only — otherwise an index route highlights for every child. */
  exact?: boolean;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export const seekerNav: NavSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        primary: true,
        exact: true,
      },
      {
        href: "/dashboard/applications",
        label: "Applications",
        icon: FileText,
        primary: true,
      },
      { href: "/dashboard/saved", label: "Saved jobs", icon: Bookmark, primary: true },
      { href: "/dashboard/alerts", label: "Job alerts", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      { href: "/dashboard/resumes", label: "Resumes", icon: ScrollText },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function employerNav(companySlug: string): NavSection[] {
  const base = `/employer/${companySlug}`;
  return [
    {
      items: [
        {
          href: base,
          label: "Overview",
          icon: LayoutDashboard,
          primary: true,
          exact: true,
        },
        { href: `${base}/jobs`, label: "Jobs", icon: Briefcase, primary: true },
        { href: `${base}/applicants`, label: "Applicants", icon: Users, primary: true },
      ],
    },
    {
      label: "Company",
      items: [
        { href: `${base}/company`, label: "Company profile", icon: Building2 },
        { href: `${base}/team`, label: "Team", icon: Users },
        { href: `${base}/billing`, label: "Billing", icon: CreditCard },
        { href: `${base}/settings`, label: "Settings", icon: Settings },
      ],
    },
  ];
}

/**
 * Which manifest an area uses, as a serializable value.
 *
 * `NavSection` holds Lucide icons, which are functions — React refuses to pass
 * functions from a Server Component to a Client Component. So the server sends
 * this plain descriptor and the client resolves it to real sections via
 * `resolveNav`, keeping the icon components entirely on the client side.
 */
export type NavKind =
  { type: "seeker" } | { type: "employer"; companySlug: string } | { type: "admin" };

export function resolveNav(kind: NavKind): NavSection[] {
  switch (kind.type) {
    case "seeker":
      return seekerNav;
    case "employer":
      return employerNav(kind.companySlug);
    case "admin":
      return adminNav;
  }
}

export const adminNav: NavSection[] = [
  {
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: LayoutDashboard,
        primary: true,
        exact: true,
      },
      { href: "/admin/jobs", label: "Moderation", icon: ShieldCheck, primary: true },
      {
        href: "/admin/companies",
        label: "Verification",
        icon: Building2,
        primary: true,
      },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/orders", label: "Orders", icon: Receipt },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText },
    ],
  },
];
