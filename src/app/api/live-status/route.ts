import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchKickChannelStatus } from "@/lib/kick";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TWITCH_API_URL = "https://api.twitch.tv/helix";
const CHECK_INTERVAL_MS = 2 * 60 * 1000;

type StreamStatusResult = {
  is_live: boolean;
  title: string | null;
  viewers: number | null;
  thumbnail: string | null;
};

/**
 * Creates a Supabase client for anonymous/public access.
 *
 * The client is configured using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * and has auth token auto-refresh and session persistence disabled.
 *
 * @returns A Supabase client configured for anonymous access with autoRefreshToken and persistSession set to `false`
 */
function getSupabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Determines whether the cached status should be refreshed based on the provided last update timestamp.
 *
 * @param lastUpdate - ISO 8601 timestamp of the last refresh, or `null` if the status has never been refreshed
 * @returns `true` if a refresh should be performed (when `lastUpdate` is `null` or older than CHECK_INTERVAL_MS), `false` otherwise
 */
function shouldRefresh(lastUpdate: string | null): boolean {
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() >= CHECK_INTERVAL_MS;
}

/**
 * Fetches a Twitch app access token using the client credentials grant.
 *
 * @returns The access token string on success, or `null` if the request fails or the token cannot be obtained.
 */
async function getTwitchAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: "POST" }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Determines the current Twitch stream status for a username, updates the corresponding `streamer_config` row, and returns a normalized status object.
 *
 * @param configId - The `streamer_config` row `id` to update.
 * @param twitchUsername - The Twitch username whose stream status will be checked.
 * @param lastUpdate - ISO timestamp of the last Twitch check; used to decide whether to refresh the status.
 * @returns A `StreamStatusResult` with `is_live`, `title`, `viewers`, and `thumbnail`, or `null` if the status was not refreshed or could not be retrieved.
 */
async function checkAndUpdateTwitchStatus(
  configId: string,
  twitchUsername: string,
  lastUpdate: string | null
): Promise<StreamStatusResult | null> {
  if (!shouldRefresh(lastUpdate)) return null;

  try {
    const accessToken = await getTwitchAccessToken();
    if (!accessToken) return null;

    const response = await fetch(
      `${TWITCH_API_URL}/streams?user_login=${twitchUsername}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID!,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const stream = data.data?.[0];
    const result: StreamStatusResult = {
      is_live: !!stream,
      title: stream?.title ?? null,
      viewers: stream?.viewer_count ?? null,
      thumbnail:
        stream?.thumbnail_url
          ?.replace("{width}", "320")
          .replace("{height}", "180") ?? null,
    };

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("streamer_config")
      .update({
        is_live_twitch: result.is_live,
        twitch_stream_title: result.title,
        twitch_viewer_count: result.viewers,
        twitch_thumbnail_url: result.thumbnail,
        last_twitch_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", configId);

    if (error) {
      console.error("Erro ao atualizar Twitch no banco:", error);
    }

    return result;
  } catch (error) {
    console.error("Erro ao verificar Twitch:", error);
    return null;
  }
}

/**
 * Checks Kick channel status for a username, updates the corresponding streamer_config row, and returns a normalized status object.
 *
 * @param configId - ID of the `streamer_config` row to update
 * @param kickUsername - Kick channel username to query
 * @param lastUpdate - ISO timestamp of the last Kick status update, or `null`
 * @returns A `StreamStatusResult` containing live state, title, viewer count, and thumbnail, or `null` if the status was not refreshed or could not be retrieved
 */
async function checkAndUpdateKickStatus(
  configId: string,
  kickUsername: string,
  lastUpdate: string | null
): Promise<StreamStatusResult | null> {
  if (!shouldRefresh(lastUpdate)) return null;

  try {
    const kickStatus = await fetchKickChannelStatus(kickUsername);
    if (kickStatus === null) return null;

    const result: StreamStatusResult = {
      is_live: kickStatus.isLive,
      title: kickStatus.title,
      viewers: kickStatus.viewers,
      thumbnail: kickStatus.thumbnail,
    };

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("streamer_config")
      .update({
        is_live_kick: result.is_live,
        kick_stream_title: result.title,
        kick_viewer_count: result.viewers,
        kick_thumbnail_url: result.thumbnail,
        last_kick_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", configId);

    if (error) {
      console.error("Erro ao atualizar Kick no banco:", error);
    }

    return result;
  } catch (error) {
    console.error("Erro ao verificar Kick:", error);
    return null;
  }
}

/**
 * Handles GET requests for the streamer's status by reading the stored configuration,
 * optionally refreshing Twitch and Kick statuses when due, and returning a combined status payload.
 *
 * @returns A NextResponse JSON payload. On success, an object with:
 * - `is_live_twitch`, `is_live_kick` (booleans)
 * - `twitch_stream_title`, `kick_stream_title` (string | null)
 * - `twitch_viewer_count`, `kick_viewer_count` (number | null)
 * - `twitch_thumbnail_url`, `kick_thumbnail_url` (string | null)
 * - `twitch_username`, `kick_username` (string | null).
 * If the streamer configuration is not found, returns `{ error: "Streamer config not found" }` with status 404.
 * If an unexpected error occurs, returns `{ error: "Internal server error" }` with status 500.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAnon();
    const { data: status, error } = await supabase
      .from("streamer_config")
      .select("*")
      .single();

    if (error || !status) {
      console.error("Erro ao buscar status do streamer:", error);
      return NextResponse.json(
        { error: "Streamer config not found" },
        { status: 404 }
      );
    }

    const [twitchUpdate, kickUpdate] = await Promise.all([
      checkAndUpdateTwitchStatus(
        status.id,
        status.twitch_username,
        status.last_twitch_update ?? null
      ),
      checkAndUpdateKickStatus(
        status.id,
        status.kick_username,
        status.last_kick_update ?? null
      ),
    ]);

    const twitchData = twitchUpdate ?? {
      is_live: status.is_live_twitch,
      title: status.twitch_stream_title,
      viewers: status.twitch_viewer_count,
      thumbnail: status.twitch_thumbnail_url,
    };

    const kickData = kickUpdate ?? {
      is_live: status.is_live_kick,
      title: status.kick_stream_title,
      viewers: status.kick_viewer_count,
      thumbnail: status.kick_thumbnail_url,
    };

    return NextResponse.json({
      is_live_twitch: twitchData.is_live,
      is_live_kick: kickData.is_live,
      twitch_stream_title: twitchData.title,
      kick_stream_title: kickData.title,
      twitch_viewer_count: twitchData.viewers,
      kick_viewer_count: kickData.viewers,
      twitch_thumbnail_url: twitchData.thumbnail,
      kick_thumbnail_url: kickData.thumbnail,
      twitch_username: status.twitch_username,
      kick_username: status.kick_username,
    });
  } catch (error) {
    console.error("Erro ao buscar status do streamer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
