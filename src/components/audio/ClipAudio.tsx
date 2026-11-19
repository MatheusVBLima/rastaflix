"use client";

import { useEffect, useRef } from "react";
import {
  AudioPlayer,
  AudioPlayerPlay,
  AudioPlayerRate,
  AudioPlayerSeek,
  AudioPlayerTime,
} from "@/components/ui/audio-player";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { DownloadIcon } from "@/components/icons/animated/download";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { cn } from "@/lib/utils";

/** Só um áudio toca por vez na página. */
let current: { id: string; pause: () => void } | null = null;

interface ClipAudioProps {
  id: string;
  src: string;
  /** Nome do arquivo baixado (sem extensão). */
  downloadName?: string;
  className?: string;
}

/**
 * Player compacto (audiocn): tocar/pausar, posição, tempo, velocidade e baixar.
 */
export function ClipAudio({ id, src, downloadName, className }: ClipAudioProps) {
  const playerRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);
  const download = useAnimatedIcon<AnimatedIconHandle>();

  const player = useAudioPlayer({
    src,
    preload: "metadata",
    onPlay: () => {
      if (current && current.id !== id) current.pause();
      current = { id, pause: () => playerRef.current?.pause() };
    },
  });
  playerRef.current = player;

  useEffect(
    () => () => {
      if (current?.id === id) current = null;
    },
    [id]
  );

  const fileName = `${(downloadName ?? "audio").replace(/[^\p{L}\p{N}]+/gu, "_")}.wav`;

  return (
    <AudioPlayer
      player={player}
      className={cn(
        "flex-nowrap gap-2 rounded-full border bg-background/60 p-1 pr-2",
        className
      )}
    >
      <AudioPlayerPlay className="size-9">
        {({ playing }) =>
          playing ? (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor" aria-hidden>
              <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.7-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
            </svg>
          )
        }
      </AudioPlayerPlay>
      <AudioPlayerSeek className="min-w-16" />
      <AudioPlayerTime type="remaining" />
      <AudioPlayerRate rates={[1, 1.5, 2]} />
      <a
        href={src}
        download={fileName}
        aria-label="Baixar áudio"
        title="Baixar áudio"
        {...download.handlers}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <DownloadIcon ref={download.ref} size={16} aria-hidden />
      </a>
    </AudioPlayer>
  );
}
