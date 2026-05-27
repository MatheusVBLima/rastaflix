const KICK_API_BASE = "https://kick.com/api/v2/channels";

export interface KickChannelStatus {
  isLive: boolean;
  title: string | null;
  viewers: number | null;
  thumbnail: string | null;
}

interface KickApiLivestream {
  session_title?: string;
  viewer_count?: number;
  thumbnail?: { url?: string };
}

interface KickApiChannel {
  livestream?: KickApiLivestream | null;
}

function normalizeKickSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

function getKickRequestHeaders(acceptHtml = false): HeadersInit {
  return {
    Accept: acceptHtml
      ? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      : "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://kick.com/",
    Origin: "https://kick.com",
  };
}

function parseKickChannelData(data: KickApiChannel): KickChannelStatus {
  const livestream = data.livestream ?? null;
  return {
    isLive: livestream !== null,
    title: livestream?.session_title ?? null,
    viewers: livestream?.viewer_count ?? null,
    thumbnail: livestream?.thumbnail?.url ?? null,
  };
}

function findChannelInPayload(payload: unknown): KickApiChannel | null {
  if (!payload || typeof payload !== "object") return null;

  if (
    "livestream" in payload &&
    (payload as KickApiChannel).livestream !== undefined
  ) {
    return payload as KickApiChannel;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = findChannelInPayload(item);
      if (found) return found;
    }
    return null;
  }

  for (const value of Object.values(payload as Record<string, unknown>)) {
    const found = findChannelInPayload(value);
    if (found) return found;
  }

  return null;
}

async function fetchFromKickApi(slug: string): Promise<KickChannelStatus | null> {
  const response = await fetch(`${KICK_API_BASE}/${slug}`, {
    headers: getKickRequestHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) {
    return { isLive: false, title: null, viewers: null, thumbnail: null };
  }

  if (!response.ok) {
    console.warn(`Kick API returned ${response.status} for slug "${slug}"`);
    return null;
  }

  const data = (await response.json()) as KickApiChannel;
  return parseKickChannelData(data);
}

async function fetchFromKickHtml(slug: string): Promise<KickChannelStatus | null> {
  const response = await fetch(`https://kick.com/${slug}`, {
    headers: getKickRequestHeaders(true),
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn(`Kick HTML page returned ${response.status} for slug "${slug}"`);
    return null;
  }

  const html = await response.text();
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/
  );

  if (!nextDataMatch?.[1]) {
    return null;
  }

  try {
    const nextData = JSON.parse(nextDataMatch[1]) as unknown;
    const channel = findChannelInPayload(nextData);
    if (channel) {
      return parseKickChannelData(channel);
    }
  } catch (error) {
    console.warn("Failed to parse Kick __NEXT_DATA__:", error);
  }

  return null;
}

/**
 * Fetches live status for a Kick channel.
 * Returns null if the request failed (caller should keep cached DB state).
 * Returns isLive: false only when the channel exists but is offline (404 on API).
 */
export async function fetchKickChannelStatus(
  slug: string
): Promise<KickChannelStatus | null> {
  const normalized = normalizeKickSlug(slug);
  if (!normalized) return null;

  const apiResult = await fetchFromKickApi(normalized);
  if (apiResult !== null) return apiResult;

  return fetchFromKickHtml(normalized);
}
