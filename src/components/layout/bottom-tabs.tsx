"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveNav, type NavKind } from "./nav-config";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom tab bar for the primary destinations.
 *
 * Sub-`sm` only. Reaching a hamburger at the top of the screen one-handed on a
 * large phone is awkward, and most Ethiopian traffic is mobile — the three most
 * used destinations belong within thumb reach.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iOS home indicator.
 */
export function BottomTabs({ nav }: { nav: NavKind }) {
  const pathname = usePathname();
  const items = resolveNav(nav)
    .flatMap((s) => s.items.filter((i) => i.primary))
    .slice(0, 3);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      className="bg-background border-border fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // min-h-14 keeps the touch target above the 44px floor.
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
