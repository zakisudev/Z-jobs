import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the multi-stage Dockerfile: emits a self-contained server
  // bundle so the runner image doesn't need node_modules.
  output: "standalone",

  reactStrictMode: true,
  poweredByHeader: false,

  // Fail the build on type or lint errors. Next's defaults for these are
  // permissive; a broken type must never reach production.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Public bucket (company logos/covers). Host comes from env so dev
      // (MinIO) and prod (R2) both work without a code change.
      ...(process.env.NEXT_PUBLIC_PUBLIC_ASSET_HOST
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.NEXT_PUBLIC_PUBLIC_ASSET_HOST,
            },
          ]
        : []),
    ],
  },

  experimental: {
    // Server Actions receive multipart form data; keep the cap tight since
    // real uploads go direct-to-bucket via presigned PUT, not through here.
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
