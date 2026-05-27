"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Radio, ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { KickLogo } from "@/components/icons/KickLogo";
import { TwitchLogo } from "@/components/icons/TwitchLogo";
import { queryKeys } from "@/lib/query-keys";

interface LiveStatus {
  is_live_twitch: boolean;
  is_live_kick: boolean;
  twitch_stream_title?: string | null;
  kick_stream_title?: string | null;
  twitch_viewer_count?: number | null;
  kick_viewer_count?: number | null;
  twitch_username: string;
  kick_username: string;
}

/**
 * Fetches the current live-stream status from the backend endpoint.
 *
 * @returns The fetched `LiveStatus` payload.
 * @throws Error when the network response has a non-ok status.
 */
async function fetchLiveStatus(): Promise<LiveStatus> {
  const response = await fetch("/api/live-status", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch live status");
  }
  return response.json();
}

/**
 * Render a live-status control that indicates whether Twitch or Kick streams are live and provides links to each channel.
 *
 * When the status is loading, a disabled "Lives" button is shown. Once loaded, a button reflects the overall live state and opens a dropdown with per-provider items that show stream title (when live), viewer count (when available), a live indicator, and an external link to the channel.
 *
 * @returns A JSX element: a live indicator button or dropdown containing Twitch and Kick status items with links, titles, and viewer counts.
 */
export function LiveIndicator() {
  const { data: status, isLoading } = useQuery({
    queryKey: queryKeys.liveStatus.all(),
    queryFn: fetchLiveStatus,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const isLive = status?.is_live_twitch || status?.is_live_kick;

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" disabled>
        <Radio className="h-4 w-4" />
        <span className="hidden sm:inline">Lives</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isLive ? "default" : "ghost"}
          size="sm"
          className={cn(
            "gap-2 transition-all",
            isLive && "bg-red-600 hover:bg-red-700 text-white animate-pulse"
          )}
        >
          <Radio className={cn("h-4 w-4", isLive && "animate-pulse")} />
          <span className="hidden sm:inline">
            {isLive ? "AO VIVO" : "Lives"}
          </span>
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Status das Lives
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`https://twitch.tv/${status?.twitch_username || "ovelhera"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <TwitchLogo className="h-3.5 w-auto" />
              <div className="flex flex-col">
                <span className="font-medium">Twitch</span>
                {status?.is_live_twitch && status?.twitch_stream_title && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {status.twitch_stream_title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.is_live_twitch ? (
                <>
                  {status.twitch_viewer_count != null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {status.twitch_viewer_count}
                    </span>
                  )}
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Offline</span>
              )}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`https://kick.com/${status?.kick_username || "ovelheram"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <KickLogo className="h-3.5 w-auto text-[#53FC18]" />
              <div className="flex flex-col">
                <span className="font-medium">Kick</span>
                {status?.is_live_kick && status?.kick_stream_title && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {status.kick_stream_title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.is_live_kick ? (
                <>
                  {status.kick_viewer_count != null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {status.kick_viewer_count}
                    </span>
                  )}
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Offline</span>
              )}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
