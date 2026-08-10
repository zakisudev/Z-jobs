"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection } from "./nav-config";
import { cn } from "@/lib/utils";

/**
 * Shared nav list, used by both the desktop rail and the mobile drawer.
 *
 * The old sidebar used NavLink without ever reading its `isActive` state —
 * every link got the same static className, so the app had no active-route
 * indicator anywhere. Here the current item is styled AND carries
 * `aria-current="page"`, which is what a screen reader announces.
 */
export function SidebarNav({
  sections,
  collapsed = false,
  onNavigate,
}: {
  sections: NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-col gap-6" aria-label="Section">
      {sections.map((section, i) => (
        <div key={section.label ?? i}>
          {section.label && !collapsed && (
            <p className="text-muted-foreground text-2xs mb-2 px-3 font-semibold tracking-[0.14em] uppercase">
              {section.label}
            </p>
          )}

          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    // The label is the accessible name when collapsed, since
                    // only the icon is visible.
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? // Same gold spine the job cards use, so "where I am"
                          // reads identically across the whole product.
                          "bg-primary-wash text-primary before:bg-accent before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className={cn(collapsed && "sr-only")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
