"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Briefcase } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { resolveNav, type NavKind } from "./nav-config";

/**
 * Drawer nav for below `lg`. The old shell had a fixed `w-1/5` sidebar with no
 * breakpoint at all, so on a phone it permanently ate a fifth of the viewport
 * and its labels wrapped.
 */
export function MobileNav({ nav }: { nav: NavKind }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const sections = resolveNav(nav);

  // Close on navigation. Without this the drawer stays open over the page the
  // user just asked for.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="hover:bg-muted -ml-2 rounded-md p-2 lg:hidden">
        <Menu className="size-5" aria-hidden="true" />
        <span className="sr-only">Open navigation menu</span>
      </SheetTrigger>

      <SheetContent side="left" title="Navigation">
        <div className="border-border flex h-16 shrink-0 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-md">
              <Briefcase className="size-4" aria-hidden="true" />
            </span>
            Z-Jobs
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SidebarNav
            sections={sections}
            onNavigate={() => {
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
