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

function shouldRefresh(lastUpdate: string | null): boolean {
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() >= CHECK_INTERVAL_MS;
}

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
