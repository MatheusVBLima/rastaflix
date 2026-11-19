/**
 * Extrai o ID de um vídeo do YouTube (youtube.com/watch?v=, youtu.be/, /shorts/, /embed/).
 */
export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const match = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

type ThumbQuality = "hqdefault" | "maxresdefault" | "mqdefault";

/**
 * Thumbnail para um link de conteúdo: usa a do YouTube quando possível,
 * senão a imagem salva, senão o placeholder do site.
 */
export function getThumbnail(
  url: string | null | undefined,
  fallback?: string | null,
  quality: ThumbQuality = "hqdefault"
): string {
  const id = getYoutubeId(url);
  if (id) return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
  return fallback || "/placeholder.png";
}

export function getHostLabel(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube";
    if (host.endsWith("twitch.tv")) return "Twitch";
    if (host.endsWith("kick.com")) return "Kick";
    if (host.endsWith("tiktok.com")) return "TikTok";
    if (host.endsWith("instagram.com")) return "Instagram";
    if (host === "x.com" || host.endsWith("twitter.com")) return "X";
    return host;
  } catch {
    return null;
  }
}
