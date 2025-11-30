import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "i.ytimg.com",
      "img.youtube.com", // Domínio das thumbnails do YouTube
      "i.ytimg.com", // Alternativa para o YouTube
      "avatars.githubusercontent.com",
    ],
    // Configuração adicional para permitir imagens de qualquer origem
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Image optimization habilitado para melhor performance
    unoptimized: false,
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
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;