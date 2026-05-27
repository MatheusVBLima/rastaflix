import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";
import { RastaflixOgImage } from "@/components/og/RastaflixOgImage";

export const alt = "Rastaflix — Universo Ovelhera";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function readDataUri(relativePath: string): string | undefined {
  try {
    const bytes = readFileSync(join(process.cwd(), "public", relativePath));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export default function Image() {
  const ovelheraSrc = readDataUri("ovelhito-og.png");
  const iconSrc = readDataUri("favicon.png");

  return new ImageResponse(
    <RastaflixOgImage ovelheraSrc={ovelheraSrc} iconSrc={iconSrc} />,
    {
      ...size,
    }
  );
}
