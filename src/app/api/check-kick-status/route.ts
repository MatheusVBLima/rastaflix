import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchKickChannelStatus } from "@/lib/kick";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Create a Supabase client configured for public (anon) use.
 *
 * Uses the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables to configure the client.
 *
 * @returns A Supabase client instance configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 */
function getSupabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Handle GET requests to retrieve a Kick channel's live status and related stream data.
 *
 * Queries the stored streamer configuration, attempts to fetch current status from the Kick API,
 * returns cached values if the Kick API is unavailable, and updates the stored config when fresh
 * Kick data is obtained.
 *
 * @returns A JSON response with one of the following shapes:
 * - 200 OK (fresh data): `{ is_live: boolean, stream_title: string | null, viewer_count: number | null, thumbnail_url?: string | null, username: string, cached: false }`
 * - 200 OK (cached data when Kick API unavailable): `{ is_live: boolean | null, stream_title: string | null, viewer_count: number | null, username: string, cached: true, message: string }`
 * - 404 Not Found: `{ error: "Streamer config not found" }` when no streamer configuration exists
 * - 500 Internal Server Error: `{ error: "Erro ao verificar status da Kick" }` on unexpected failures
 */
export async function GET() {
  try {
    const supabaseAnon = getSupabaseAnon();

    const { data: config, error: configError } = await supabaseAnon
      .from("streamer_config")
      .select("id, kick_username, is_live_kick, kick_stream_title, kick_viewer_count")
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: "Streamer config not found" },
        { status: 404 }
      );
    }

    const kickUsername = config.kick_username || "ovelheram";
    const kickStatus = await fetchKickChannelStatus(kickUsername);

    if (kickStatus === null) {
      return NextResponse.json({
        is_live: config.is_live_kick,
        stream_title: config.kick_stream_title,
        viewer_count: config.kick_viewer_count,
        username: kickUsername,
        cached: true,
        message: "Kick API unavailable, returning cached status",
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: updateError } = await supabaseAdmin
      .from("streamer_config")
      .update({
        is_live_kick: kickStatus.isLive,
        kick_stream_title: kickStatus.title,
        kick_viewer_count: kickStatus.viewers,
        kick_thumbnail_url: kickStatus.thumbnail,
        last_kick_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);

    if (updateError) {
      console.error("Erro ao atualizar status da Kick no banco:", updateError);
    }

    return NextResponse.json({
      is_live: kickStatus.isLive,
      stream_title: kickStatus.title,
      viewer_count: kickStatus.viewers,
      thumbnail_url: kickStatus.thumbnail,
      username: kickUsername,
      cached: false,
    });
  } catch (error) {
    console.error("Erro ao verificar status da Kick:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status da Kick" },
      { status: 500 }
    );
  }
}
