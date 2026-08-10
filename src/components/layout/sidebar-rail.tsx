"use client";

import * as React from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { WordmarkIcon } from "./wordmark";
import { SidebarNav } from "./sidebar-nav";
import { resolveNav, type NavKind } from "./nav-config";
import { cn } from "@/lib/utils";

/**
 * Persistent desktop sidebar, collapsible to an icon rail.
 *
 * The collapsed flag is mirrored into a cookie so the server renders the same
 * width on the next request. Keeping it only in React state would render the
 * expanded sidebar on the server and snap it closed after hydration on every
 * navigation.
 */
export function SidebarRail({
  nav,
  defaultCollapsed,
}: {
  nav: NavKind;
  defaultCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const sections = resolveNav(nav);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // 1 year, lax: this is a display preference, not a credential.
    document.cookie = `zj_sidebar=${next ? "collapsed" : "expanded"};path=/;max-age=31536000;samesite=lax`;
  }

  return (
    <aside
      className={cn(
        "border-border bg-card hidden shrink-0 border-r lg:flex lg:flex-col",
        collapsed ? "lg:w-16" : "lg:w-64",
      )}
    >
      <div
        className={cn(
          "border-border flex h-16 shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          title={collapsed ? "Z-Jobs" : undefined}
        >
          <WordmarkIcon className="size-8 shrink-0" />
          <span className={cn("display text-lg tracking-tight", collapsed && "sr-only")}>
            Z-Jobs
          </span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <SidebarNav sections={sections} collapsed={collapsed} />
      </div>

      <div className="border-border border-t p-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span className={cn(collapsed && "sr-only")}>Collapse</span>
        </button>
      </div>
    </aside>
  );
}
