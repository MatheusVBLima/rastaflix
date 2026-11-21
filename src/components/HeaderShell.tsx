import { getHeaderAuth } from "@/lib/auth";
import { fetchStreamerStatus } from "@/lib/queries";
import { Header } from "@/components/Header";
import type { LiveStatus } from "@/lib/types";

/**
 * Renders the Header component with server-resolved auth and cached live status
 * so the header paints in its final state without skeleton flashes or layout shift.
 */
export async function HeaderShell() {
  const [initialAuth, streamer] = await Promise.all([
    getHeaderAuth(),
    fetchStreamerStatus().catch(() => null),
  ]);

  const initialLiveStatus: LiveStatus | null = streamer
    ? {
        is_live_twitch: Boolean(streamer.is_live_twitch),
        is_live_kick: Boolean(streamer.is_live_kick),
        twitch_stream_title: streamer.twitch_stream_title ?? null,
        kick_stream_title: streamer.kick_stream_title ?? null,
        twitch_viewer_count: streamer.twitch_viewer_count ?? null,
        kick_viewer_count: streamer.kick_viewer_count ?? null,
        twitch_username: streamer.twitch_username,
        kick_username: streamer.kick_username,
      }
    : null;

  return (
    <Header
      initialAuth={initialAuth}
      initialLiveStatus={initialLiveStatus}
    />
  );
}
