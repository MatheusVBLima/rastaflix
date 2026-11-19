import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
  },
  images: {
    // Allowlist: an open "**" lets anyone use our image optimizer as a proxy for any URL.
    remotePatterns: [
      // Supabase Storage (award nominee images)
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // YouTube thumbnails (historias, musicas, clipes)
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      // Twitch / Kick clip thumbnails
      { protocol: "https", hostname: "**.jtvnw.net" },
      { protocol: "https", hostname: "**.twitch.tv" },
      { protocol: "https", hostname: "**.kick.com" },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
