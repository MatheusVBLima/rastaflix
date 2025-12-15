"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "./commonActions";
import { StreamerConfig } from "@/lib/types";

export interface UpdateStreamerStatusParams {
  platform: "twitch" | "kick";
  is_live: boolean;
  stream_title?: string | null;
  viewer_count?: number | null;
  thumbnail_url?: string | null;
}

export async function updateStreamerStatus(
  params: UpdateStreamerStatusParams
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await getSupabaseClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.platform === "twitch") {
      updateData.is_live_twitch = params.is_live;
      updateData.twitch_stream_title = params.stream_title;
      updateData.twitch_viewer_count = params.viewer_count;
      updateData.twitch_thumbnail_url = params.thumbnail_url;
      updateData.last_twitch_update = new Date().toISOString();
    } else if (params.platform === "kick") {
      updateData.is_live_kick = params.is_live;
      updateData.kick_stream_title = params.stream_title;
      updateData.kick_viewer_count = params.viewer_count;
      updateData.kick_thumbnail_url = params.thumbnail_url;
      updateData.last_kick_update = new Date().toISOString();
    }

    const { error } = await supabase
      .from("streamer_config")
      .update(updateData)
      .eq("twitch_username", "ovelhera");

    if (error) {
      console.error("Erro ao atualizar status do streamer:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, message: "Erro interno ao atualizar status" };
  }
}

export async function setTwitchUserId(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from("streamer_config")
      .update({ twitch_user_id: userId, updated_at: new Date().toISOString() })
      .eq("twitch_username", "ovelhera");

    if (error) {
      console.error("Erro ao definir Twitch User ID:", error);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao definir Twitch User ID:", error);
    return { success: false, message: "Erro interno" };
  }
}
