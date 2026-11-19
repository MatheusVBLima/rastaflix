import { readFileSync } from "fs";
import { join } from "path";

export function readPublicDataUri(relativePath: string): string | undefined {
  try {
    const bytes = readFileSync(join(process.cwd(), "public", relativePath));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

async function fetchGoogleFont(
  family: string,
  weight: 400 | 500 | 600 | 700
): Promise<OgFont | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}&display=swap`;
    // User-Agent antigo faz o Google Fonts devolver .ttf (suportado pelo Satori/next/og)
    const cssRes = await fetch(cssUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64)" },
      signal: AbortSignal.timeout(3000),
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/i)
      ?? css.match(/src:\s*url\(([^)]+)\)/i);
    const fontUrl = match?.[1]?.replace(/['"]/g, "");
    if (!fontUrl) return null;

    const fontRes = await fetch(fontUrl, { signal: AbortSignal.timeout(3000) });
    if (!fontRes.ok) return null;
    return {
      name: family,
      data: await fontRes.arrayBuffer(),
      weight,
      style: "normal",
    };
  } catch {
    return null;
  }
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const results = await Promise.all([
    fetchGoogleFont("Unbounded", 600),
    fetchGoogleFont("Unbounded", 700),
    fetchGoogleFont("Geist", 500),
    fetchGoogleFont("Geist", 600),
  ]);
  return results.filter((font): font is OgFont => font !== null);
}
