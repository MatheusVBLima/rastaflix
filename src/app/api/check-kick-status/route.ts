import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KICK_API_URL = "https://kick.com/api/v2/channels";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface KickChannelResponse {
  id: number;
  slug: string;
  user: {
    username: string;
  };
  livestream: {
    id: number;
    session_title: string;
    viewer_count: number;
    thumbnail: {
      url: string;
    };
  } | null;
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Buscar config do streamer para pegar o username da Kick
    const { data: config } = await supabase
      .from("streamer_config")
      .select("kick_username")
      .single();

    const kickUsername = config?.kick_username || "OvelheraM";

    // Buscar status na API da Kick
    const response = await fetch(`${KICK_API_URL}/${kickUsername}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Rastaflix/1.0",
      },
      next: { revalidate: 0 }, // Não cachear
    });

    if (!response.ok) {
      // Se der erro 404, o canal não existe ou está com problema
      if (response.status === 404) {
        await updateKickStatus(supabase, false, null, null, null);
        return NextResponse.json({
          is_live: false,
          message: "Canal não encontrado"
        });
      }

      throw new Error(`Kick API error: ${response.status}`);
    }

    const data: KickChannelResponse = await response.json();

    const isLive = data.livestream !== null;
    const streamTitle = data.livestream?.session_title || null;
    const viewerCount = data.livestream?.viewer_count || null;
    const thumbnailUrl = data.livestream?.thumbnail?.url || null;

    // Atualizar no banco
    await updateKickStatus(supabase, isLive, streamTitle, viewerCount, thumbnailUrl);

    return NextResponse.json({
      is_live: isLive,
      stream_title: streamTitle,
      viewer_count: viewerCount,
      thumbnail_url: thumbnailUrl,
      username: kickUsername,
    });
  } catch (error) {
    console.error("Erro ao verificar status da Kick:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status da Kick" },
      { status: 500 }
    );
  }
}

async function updateKickStatus(
  supabase: ReturnType<typeof getSupabaseClient>,
  isLive: boolean,
  streamTitle: string | null,
  viewerCount: number | null,
  thumbnailUrl: string | null
) {
  const { error } = await supabase
    .from("streamer_config")
    .update({
      is_live_kick: isLive,
      kick_stream_title: streamTitle,
      kick_viewer_count: viewerCount,
      kick_thumbnail_url: thumbnailUrl,
      last_kick_update: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("kick_username", "OvelheraM");

  if (error) {
    console.error("Erro ao atualizar status da Kick no banco:", error);
  }
}
