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

/**
 * Normalize a Kick channel slug to lowercase and remove surrounding whitespace.
 *
 * @param slug - The channel slug to normalize (may contain mixed case or surrounding whitespace)
 * @returns The normalized slug in lowercase with leading and trailing whitespace removed
 */
function normalizeKickSlug(slug: string): string {
  return slug.toLowerCase().trim();
}

/**
 * Builds request headers suitable for fetching Kick channel pages or API endpoints.
 *
 * @param acceptHtml - When true, sets `Accept` to HTML-like content types; otherwise sets `Accept` to `application/json`.
 * @returns A `HeadersInit` object preconfigured for requests to `kick.com`.
 */
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

/**
 * Normalize a Kick API channel payload into a standardized KickChannelStatus.
 *
 * @param data - Channel payload from Kick API; may omit `livestream` or contain it as `null`.
 * @returns A KickChannelStatus where `isLive` is `true` when `livestream` is present, `title` is `livestream.session_title` or `null`, `viewers` is `livestream.viewer_count` or `null`, and `thumbnail` is `livestream.thumbnail.url` or `null`.
 */
function parseKickChannelData(data: KickApiChannel): KickChannelStatus {
  const livestream = data.livestream ?? null;
  return {
    isLive: livestream !== null,
    title: livestream?.session_title ?? null,
    viewers: livestream?.viewer_count ?? null,
    thumbnail: livestream?.thumbnail?.url ?? null,
  };
}

/**
 * Searches a JSON-like structure for an object that contains a `livestream` property and returns that object.
 *
 * @param payload - The unknown JSON value (object/array/primitive) to search recursively
 * @returns The first object found that has a `livestream` property (the property's value may be `null`), or `null` if no such object exists
 */
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

/**
 * Fetches and parses channel status from the Kick JSON API for the given channel slug.
 *
 * @param slug - The channel identifier to query (e.g., "someStreamer")
 * @returns A `KickChannelStatus` parsed from the API on success; the offline-but-existing status
 *          `{ isLive: false, title: null, viewers: null, thumbnail: null }` if the API returns 404;
 *          `null` for other non-OK responses.
 */
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

/**
 * Retrieve a Kick channel's status by fetching the channel HTML page and extracting the embedded Next.js `__NEXT_DATA__` payload.
 *
 * Attempts to parse the page's `<script id="__NEXT_DATA__" type="application/json">` content, locate a `livestream`-containing object, and normalize it into a `KickChannelStatus`.
 *
 * @returns `KickChannelStatus` when a channel object is found and parsed; `null` if the HTTP response is not OK, the embedded data is missing or cannot be parsed, or no channel payload is located.
 */
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
 * Retrieve a Kick channel's live status, trying the JSON API first and falling back to HTML extraction.
 *
 * @param slug - The channel slug or identifier; it will be normalized before use.
 * @returns A `KickChannelStatus` with `isLive`, `title`, `viewers`, and `thumbnail`, or `null` if the slug is empty/invalid or network/parse errors prevented retrieval. `isLive: false` specifically indicates the channel exists but is offline (API returned 404).
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
