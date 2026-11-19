"use client";

import type { Music } from "@/lib/types";
import { getHostLabel } from "@/lib/media";
import { Thumb } from "./Thumb";
import { CopyLinkButton } from "./CopyLinkButton";

interface MusicCardProps {
  music: Music;
  priority?: boolean;
}

/**
 * Card de música em formato de capa de disco: o vinil aparece por trás da
 * capa e desliza para fora (girando) no hover/foco.
 */
export function MusicCard({ music, priority }: MusicCardProps) {
  const host = getHostLabel(music.url);

  return (
    <article className="group relative grid gap-4">
      <div className="relative w-full" style={{ aspectRatio: "1.14 / 1" }}>
        {/* Vinil */}
        <div
          aria-hidden
          className="absolute inset-y-[4%] right-0 aspect-square translate-x-0 transition-transform duration-500 ease-out group-hover:translate-x-[10%] group-focus-within:translate-x-[10%]"
        >
          <div
            className="relative size-full rounded-full shadow-lg group-hover:vinyl-spin group-focus-within:vinyl-spin"
            style={{
              background:
                "radial-gradient(circle, var(--primary) 0 15%, oklch(0.1 0 0) 15.5% 17%, oklch(0.16 0 0) 17.5% 100%)",
            }}
          >
            {/* sulcos */}
            <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,oklch(1_0_0/0.05)_0_1px,transparent_1px_4px)]" />
            {/* brilho: é o que deixa o giro visível */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(transparent_0_12%,oklch(1_0_0/0.14)_18%,transparent_26%_62%,oklch(1_0_0/0.1)_68%,transparent_76%)]" />
            <div className="absolute left-1/2 top-1/2 size-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
          </div>
        </div>

        {/* Capa */}
        <div className="absolute inset-y-0 left-0 aspect-square overflow-hidden rounded-lg bg-muted shadow-md ring-1 ring-border transition-[translate,box-shadow] duration-500 ease-out group-hover:-translate-x-[2%] group-hover:shadow-xl">
          <Thumb
            url={music.url}
            fallbackSrc={music.imageUrl}
            title={music.title}
            priority={priority}
            cropLetterbox
            sizes="(max-width: 640px) 45vw, (max-width: 1200px) 30vw, 22vw"
          />
          <CopyLinkButton
            url={music.url}
            label={`Copiar link de ${music.title}`}
            className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
          />
        </div>
      </div>

      <h3 className="line-clamp-2 pr-[12%] text-base font-semibold leading-snug">
        <a
          href={music.url}
          target="_blank"
          rel="noopener noreferrer"
          className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
        >
          {music.title}
          {host && <span className="sr-only"> (abre no {host})</span>}
        </a>
      </h3>
    </article>
  );
}
