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
    // Desabilita o otimizador de imagens para URLs externas no ambiente de produção
    unoptimized: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
