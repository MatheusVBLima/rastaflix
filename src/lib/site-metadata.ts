import type { Metadata } from "next";

export const SITE_NAME = "Rastaflix";
export const SITE_DESCRIPTION =
  "Acompanhe a saga do nosso rastafari mineiro — histórias, músicas, esculachos, clipes e o universo Ovelhera.";
export const SITE_TAGLINE = "Histórias • Músicas • Esculachos • Lives";

export function getSiteUrl(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (!fromEnv) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  }
  return new URL(fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`);
}

export const siteMetadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Rastaflix",
    "Ovelhera",
    "Givaldo",
    "live",
    "Twitch",
    "Kick",
    "histórias",
    "esculachos",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: getSiteUrl().toString(),
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Rastaflix - Universo Ovelhera",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Rastaflix - Universo Ovelhera",
        type: "image/png",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function pageMetadata(
  title: string,
  description: string,
  path?: `/${string}`
): Metadata {
  const url = path ? new URL(path, getSiteUrl()).toString() : undefined;

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      title,
      description,
    },
  };
}
