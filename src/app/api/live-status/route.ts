import { NextResponse } from "next/server";
import { fetchStreamerStatus } from "@/lib/queries";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // Sempre dinâmico
export const revalidate = 0; // Não cachear no edge

const KICK_API_URL = "https://kick.com/api/v2/channels";
const KICK_CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function checkAndUpdateKickStatus(kickUsername: string, lastUpdate: string | null) {
  // Verificar se precisa atualizar (última verificação > 2 minutos)
  if (lastUpdate) {
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    if (now - lastUpdateTime < KICK_CHECK_INTERVAL_MS) {
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
      title: data.livestream?.session_title || null,
      viewers: data.livestream?.viewer_count || null,
      thumbnail: data.livestream?.thumbnail?.url || null,
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
    const status = await fetchStreamerStatus();

    if (!status) {
      return NextResponse.json(
        { error: "Streamer config not found" },
        { status: 404 }
      );
    }

    // Lazy polling: verificar Kick se última atualização foi há mais de 2 min
    const kickUpdate = await checkAndUpdateKickStatus(
      status.kick_username,
      status.last_kick_update ?? null
    );

    // Usar dados atualizados da Kick se disponíveis
    const kickData = kickUpdate || {
      is_live: status.is_live_kick,
      title: status.kick_stream_title,
      viewers: status.kick_viewer_count,
      thumbnail: status.kick_thumbnail_url,
    };

    return NextResponse.json({
      is_live_twitch: status.is_live_twitch,
      is_live_kick: kickData.is_live,
      twitch_stream_title: status.twitch_stream_title,
      kick_stream_title: kickData.title,
      twitch_viewer_count: status.twitch_viewer_count,
      kick_viewer_count: kickData.viewers,
      twitch_thumbnail_url: status.twitch_thumbnail_url,
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
