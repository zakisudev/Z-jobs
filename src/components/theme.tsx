"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * `attribute="data-theme"` is required: globals.css defines the dark palette
 * under `:root[data-theme="dark"]`, not next-themes' default `.dark` class.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/**
 * Three-state toggle rather than a binary switch, because "system" is a real
 * preference and a two-way switch silently overrides it forever on first click.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // The server cannot know the resolved theme, so render a stable placeholder
  // until hydration rather than flashing the wrong selection.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="border-border bg-muted/50 inline-flex rounded-md border p-0.5"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const checked = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={opt.label}
            onClick={() => {
              setTheme(opt.value);
            }}
            className={cn(
              "grid size-7 place-items-center rounded transition-colors",
              checked
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
