import type { Metadata } from "next";

export const SITE_NAME = "Rastaflix";
export const SITE_DESCRIPTION =
  "Acompanhe a saga do nosso rastafari mineiro — histórias, músicas, esculachos, clipes e o universo Ovelhera.";
export const SITE_TAGLINE = "Histórias • Músicas • Esculachos • Lives";

export function getSiteUrl(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    return new URL(fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("https://rastaflix.vercel.app");
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
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function pageMetadata(
  title: string,
  description: string
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}
