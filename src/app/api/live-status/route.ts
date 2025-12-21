import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // Sempre dinâmico
export const revalidate = 0; // Não cachear no edge

const KICK_API_URL = "https://kick.com/api/v2/channels";
const TWITCH_API_URL = "https://api.twitch.tv/helix";
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos

// Cliente Supabase sem autenticação para acesso público
function getSupabaseClient() {
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

async function checkAndUpdateTwitchStatus(twitchUsername: string, lastUpdate: string | null) {
  // Verificar se precisa atualizar (última verificação > 2 minutos)
  if (lastUpdate) {
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    if (now - lastUpdateTime < CHECK_INTERVAL_MS) {
      return null; // Não precisa atualizar ainda
    }
  }

  try {
    const accessToken = await getTwitchAccessToken();
    if (!accessToken) return null;

    const response = await fetch(
      `${TWITCH_API_URL}/streams?user_login=${twitchUsername}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID!,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const stream = data.data?.[0];
    const isLive = !!stream;

    const result = {
      is_live: isLive,
      title: stream?.title ?? null,
      viewers: stream?.viewer_count ?? null,
      thumbnail: stream?.thumbnail_url?.replace("{width}", "320").replace("{height}", "180") ?? null,
    };

    // Atualizar no banco
    const supabase = getSupabaseClient();
    await supabase
      .from("streamer_config")
      .update({
        is_live_twitch: result.is_live,
        twitch_stream_title: result.title,
        twitch_viewer_count: result.viewers,
        twitch_thumbnail_url: result.thumbnail,
        last_twitch_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("twitch_username", twitchUsername);

    return result;
  } catch (error) {
    console.error("Erro ao verificar Twitch:", error);
    return null;
  }
}

async function checkAndUpdateKickStatus(kickUsername: string, lastUpdate: string | null) {
  // Verificar se precisa atualizar (última verificação > 2 minutos)
  if (lastUpdate) {
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    if (now - lastUpdateTime < CHECK_INTERVAL_MS) {
      return null; // Não precisa atualizar ainda
    }
  }

  try {
    const response = await fetch(`${KICK_API_URL}/${kickUsername}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Rastaflix/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return { is_live: false, title: null, viewers: null, thumbnail: null };
    }

    const data = await response.json();
    const isLive = data.livestream !== null;

    const result = {
      is_live: isLive,
      title: data.livestream?.session_title ?? null,
      viewers: data.livestream?.viewer_count ?? null,
      thumbnail: data.livestream?.thumbnail?.url ?? null,
    };

    // Atualizar no banco em background
    const supabase = getSupabaseClient();
    supabase
      .from("streamer_config")
      .update({
        is_live_kick: result.is_live,
        kick_stream_title: result.title,
        kick_viewer_count: result.viewers,
        kick_thumbnail_url: result.thumbnail,
        last_kick_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("kick_username", kickUsername)
      .then(() => {});

    return result;
  } catch (error) {
    console.error("Erro ao verificar Kick:", error);
    return null;
  }
}

export async function GET() {
  try {
    // Buscar status diretamente usando cliente público (sem autenticação)
    const supabase = getSupabaseClient();
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

    // Lazy polling: verificar ambas plataformas se última atualização foi há mais de 2 min
    const [twitchUpdate, kickUpdate] = await Promise.all([
      checkAndUpdateTwitchStatus(
        status.twitch_username,
        status.last_twitch_update ?? null
      ),
      checkAndUpdateKickStatus(
        status.kick_username,
        status.last_kick_update ?? null
      ),
    ]);

    // Usar dados atualizados se disponíveis
    const twitchData = twitchUpdate || {
      is_live: status.is_live_twitch,
      title: status.twitch_stream_title,
      viewers: status.twitch_viewer_count,
      thumbnail: status.twitch_thumbnail_url,
    };

    const kickData = kickUpdate || {
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
