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
};

export default nextConfig;
