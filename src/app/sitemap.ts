import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-metadata";

const PUBLIC_ROUTES = [
  "",
  "/historias",
  "/musicas",
  "/esculachos",
  "/inimigos",
  "/clipes",
  "/rasta-awards",
  "/bingo",
  "/ovelhera-dle",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().origin;
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "daily",
    priority: path === "" ? 1 : 0.8,
  }));
}
