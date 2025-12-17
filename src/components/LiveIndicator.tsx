"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

export function LiveIndicator() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/live-status", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Erro ao buscar status da live:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Polling a cada 60 segundos para atualizar o status
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

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

        {/* Twitch */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`https://twitch.tv/${status?.twitch_username || "ovelhera"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
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
                  {status.twitch_viewer_count !== null && status.twitch_viewer_count !== undefined && (
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

        {/* Kick */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`https://kick.com/${status?.kick_username || "OvelheraM"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.333 0v24h5.334V12l5.333 5.333V24h5.333V12L24 18.667V5.333L17.333 12V0H12v6.667L6.667 12V0z" />
              </svg>
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
                  {status.kick_viewer_count !== null && status.kick_viewer_count !== undefined && (
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

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/clipes" className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            Ver Clipes
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
