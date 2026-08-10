"use client";

import { useTransition } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, UserRound, Settings } from "lucide-react";
import { logout } from "@/app/(auth)/_actions";

/**
 * Built on Radix DropdownMenu, which supplies roving tabindex, Escape, arrow-key
 * navigation, and aria-expanded.
 *
 * The old Navbar dropdown hand-rolled all of this: no aria-expanded, no
 * keyboard support, and a `document` click listener registered in a useEffect
 * with no cleanup — so it leaked a listener on every mount and re-registered on
 * every render, since `userInfo` was a fresh object each time.
 */
export function UserMenu({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();

  // Initials, not the whole name. The old avatar rendered the entire uppercased
  // username inside a circle, so "CHRISTOPHER" overflowed its own pill.
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="hover:bg-muted flex items-center gap-2 rounded-md p-1.5 text-sm">
        <span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold">
          {initials}
        </span>
        <span className="hidden max-w-32 truncate font-medium sm:inline">
          {firstName}
        </span>
        <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
        <span className="sr-only">Open account menu</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="bg-card border-border z-50 min-w-56 rounded-md border p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">
              {firstName} {lastName}
            </p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>

          <DropdownMenu.Separator className="bg-border my-1 h-px" />

          <DropdownMenu.Item asChild>
            <Link
              href="/dashboard/profile"
              className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm outline-none"
            >
              <UserRound className="size-4" aria-hidden="true" />
              Profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/dashboard/settings"
              className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm outline-none"
            >
              <Settings className="size-4" aria-hidden="true" />
              Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="bg-border my-1 h-px" />

          {/*
            Calls the action directly rather than wrapping a <form> in an Item.
            Radix closes the menu on select, which unmounts the form before the
            submit event can fire — the click appears to do nothing.
          */}
          <DropdownMenu.Item
            onSelect={() => {
              startTransition(() => {
                void logout();
              });
            }}
            className="hover:bg-muted text-destructive flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm outline-none"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {pending ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
