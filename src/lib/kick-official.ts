const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
const KICK_API_BASE = "https://api.kick.com/public/v1";

export interface KickChannelStatus {
  isLive: boolean;
  title: string | null;
  viewers: number | null;
  thumbnail: string | null;
}

interface KickOfficialChannel {
  slug?: string;
  stream_title?: string | null;
  stream?: {
    is_live?: boolean;
    viewer_count?: number | null;
    thumbnail?: string | null;
  } | null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getKickAppAccessToken(): Promise<string | null> {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(KICK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`Kick OAuth token request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      return null;
    }

    const expiresIn = data.expires_in ?? 3600;
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return data.access_token;
  } catch (error) {
    console.warn("Kick OAuth token error:", error);
    return null;
  }
}

/**
 * Fetches channel live status via Kick's official public API (api.kick.com).
 * Requires KICK_CLIENT_ID and KICK_CLIENT_SECRET. Returns null when credentials
 * are missing or the request fails (caller should fall back to scraping).
 */
export async function fetchKickChannelStatusOfficial(
  slug: string
): Promise<KickChannelStatus | null> {
  const token = await getKickAppAccessToken();
  if (!token) {
    return null;
  }

  const normalized = slug.toLowerCase().trim();
  const url = `${KICK_API_BASE}/channels?slug=${encodeURIComponent(normalized)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(
        `Kick official API returned ${response.status} for slug "${normalized}"`
      );
      return null;
    }

    const payload = (await response.json()) as { data?: KickOfficialChannel[] };
    const channel = payload.data?.[0];

    if (!channel) {
      return { isLive: false, title: null, viewers: null, thumbnail: null };
    }

    const isLive = channel.stream?.is_live === true;

    return {
      isLive,
      title: isLive ? (channel.stream_title ?? null) : null,
      viewers: isLive ? (channel.stream?.viewer_count ?? null) : null,
      thumbnail: isLive ? (channel.stream?.thumbnail ?? null) : null,
    };
  } catch (error) {
    console.warn("Kick official API error:", error);
    return null;
  }
}
