import { cookies } from "next/headers";
import type { NavKind } from "./nav-config";
import { SidebarRail } from "./sidebar-rail";
import { MobileNav } from "./mobile-nav";
import { BottomTabs } from "./bottom-tabs";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/components/theme";
import type { SessionUser } from "@/server/auth/context";

/**
 * The authenticated app shell, shared by the seeker, employer, and admin areas
 * with only a different nav manifest.
 *
 * Layout behaviour by breakpoint:
 *   lg+   persistent sidebar, collapsible to a 64px icon rail
 *   <lg   drawer behind a hamburger in the sticky topbar
 *   <sm   plus a bottom tab bar for the three primary destinations
 *
 * A server component so the collapsed state can be read from the cookie during
 * SSR rather than corrected after hydration.
 */
export async function AppShell({
  nav,
  user,
  title,
  actions,
  children,
}: {
  /**
   * A plain descriptor, not the resolved sections: the manifests carry Lucide
   * icons, and functions cannot be passed from a Server Component to a Client
   * Component. The client components call `resolveNav` themselves.
   */
  nav: NavKind;
  user: SessionUser;
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const collapsed = jar.get("zj_sidebar")?.value === "collapsed";

  return (
    <div className="flex min-h-dvh">
      <SidebarRail nav={nav} defaultCollapsed={collapsed} />

      {/*
        `min-w-0` is load-bearing. A flex child defaults to min-width:auto, so
        any wide descendant (a table, a long unbroken string) pushes the column
        wider than the viewport and the whole page scrolls sideways. This single
        property is what the old layout was missing.
      */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4">
            <MobileNav nav={nav} />

            {title && (
              <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
                {title}
              </h1>
            )}
            {!title && <div className="flex-1" />}

            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <UserMenu
                firstName={user.firstName}
                lastName={user.lastName}
                email={user.email}
              />
            </div>
          </div>
        </header>

        {/*
          pb-20 on mobile clears the fixed bottom tab bar; without it the last
          row of any list sits permanently underneath it.
        */}
        <main id="main" className="min-w-0 flex-1 px-4 py-6 pb-20 sm:pb-6">
          {children}
        </main>
      </div>

      <BottomTabs nav={nav} />
    </div>
  );
}
