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
import type { LiveStatus } from "@/lib/types";

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

interface LiveIndicatorProps {
  initialStatus?: LiveStatus | null;
}

/**
 * Render a live-status control that indicates whether Twitch or Kick streams are live and provides links to each channel.
 *
 * Uses server-provided `initialStatus` so SSR and first paint already match the live/offline state
 * without flicker or horizontal layout shift, while refreshing in the background.
 */
export function LiveIndicator({ initialStatus = null }: LiveIndicatorProps) {
  const { data: status } = useQuery({
    queryKey: queryKeys.liveStatus.all(),
    queryFn: fetchLiveStatus,
    initialData: initialStatus ?? undefined,
    // Marca como desatualizado apenas para atualizar em segundo plano sem entrar em loading.
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const isLive = Boolean(status?.is_live_twitch || status?.is_live_kick);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isLive ? "default" : "ghost"}
          size="sm"
          className={cn(
            "gap-2 transition-colors",
            isLive && "bg-red-600 hover:bg-red-700 text-white"
          )}
        >
          <Radio className="h-4 w-4" />
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
