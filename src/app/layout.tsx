import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Ethiopic, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * The Amharic stack. Loaded on demand, not preloaded.
 *
 * The Ethiopic subset is ~193KB *per weight*, and requesting four weights had
 * every page preloading roughly 770KB of font for script that currently
 * renders nowhere in the UI — on the mobile connections this board is actually
 * browsed on, that was the single largest thing on the page.
 *
 * `preload: false` keeps the @font-face rules, so the moment any `:lang(am)`
 * content appears the browser fetches the face it needs and nothing before
 * that. Two weights cover regular and emphasis; the rest were never referenced.
 */
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-noto-ethiopic",
  display: "swap",
  weight: ["400", "600"],
  preload: false,
});

/**
 * The display voice. One variable file covers every headline weight, so the
 * editorial direction costs a single font request rather than four static cuts.
 *
 * No `axes` option: passing one that next/font does not accept for this family
 * makes it emit no @font-face and no CSS variable at all, with no build error.
 * The symptom is silent — `var(--font-fraunces)` becomes invalid at
 * computed-value time and every headline quietly falls back to body text.
 * `.display` therefore also carries an in-`var()` fallback so a future
 * regression degrades to a serif instead of vanishing.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
  weight: "variable",
});

/**
 * Root metadata. `metadataBase` is what makes every relative OG image resolve
 * to an absolute URL — without it, social crawlers get a relative path and
 * render no preview card at all.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "Z-Jobs — Find your next job in Ethiopia",
    template: "%s | Z-Jobs",
  },
  description:
    "Browse and apply to jobs across Ethiopia, or post a vacancy and reach thousands of qualified candidates.",
  applicationName: "Z-Jobs",
  openGraph: {
    type: "website",
    siteName: "Z-Jobs",
    locale: "en_ET",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    // Must track --paper in globals.css, or the browser chrome sits on a
    // different white than the page and the seam is visible on mobile.
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#101614" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${ethiopic.variable} ${fraunces.variable}`}>
        <ThemeProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
