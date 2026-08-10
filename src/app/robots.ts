import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated surfaces carry no SEO value and would leak internal
      // structure into the index.
      disallow: ["/dashboard", "/employer", "/admin", "/api", "/login", "/register"],
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}
