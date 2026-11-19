import { ImageResponse } from "next/og";
import { RastaflixOgImage } from "@/components/og/RastaflixOgImage";
import { loadOgFonts, readPublicDataUri } from "@/lib/og";

export const alt = "Rastaflix — Universo Ovelhera";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const ovelheraSrc = readPublicDataUri("ovelhito-og.png");
  const iconSrc = readPublicDataUri("favicon.png");
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <RastaflixOgImage ovelheraSrc={ovelheraSrc} iconSrc={iconSrc} />,
    {
      ...size,
      ...(fonts.length > 0 ? { fonts } : {}),
    }
  );
}
