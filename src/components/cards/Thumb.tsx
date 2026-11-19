"use client";

import { useState } from "react";
import Image from "next/image";
import { getYoutubeId } from "@/lib/media";
import { cn } from "@/lib/utils";

interface ThumbProps {
  url: string | null | undefined;
  /** Imagem salva no cadastro, usada quando não há thumbnail do YouTube. */
  fallbackSrc?: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
  /** Recorta as faixas pretas da hqdefault (4:3) para mostrar só o vídeo 16:9. */
  cropLetterbox?: boolean;
  className?: string;
}

/**
 * Thumbnail com fallback em cadeia: YouTube → imagem salva → placeholder
 * desenhado. Trocar `src` no onError do next/image não funciona (o srcset
 * continua apontando para a imagem quebrada), então o fallback é por estado.
 */
export function Thumb({
  url,
  fallbackSrc,
  title,
  sizes,
  priority,
  cropLetterbox,
  className,
}: ThumbProps) {
  const ytId = getYoutubeId(url);
  const sources = [
    ytId ? { src: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, yt: true } : null,
    fallbackSrc ? { src: fallbackSrc, yt: false } : null,
  ].filter(Boolean) as { src: string; yt: boolean }[];

  const [index, setIndex] = useState(0);
  const current = sources[index];

  if (!current) {
    return (
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_60%),linear-gradient(135deg,var(--muted),var(--card))] p-6",
          className
        )}
      >
        <span className="line-clamp-3 text-center font-display text-lg font-semibold leading-tight text-foreground/25">
          {title}
        </span>
      </div>
    );
  }

  return (
    <Image
      key={current.src}
      src={current.src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!current.yt}
      onError={() => setIndex((i) => i + 1)}
      onLoad={(e) => {
        // Vídeo removido: o YouTube devolve uma imagem cinza de 120×90, e o
        // cadastro às vezes salvou essa mesma imagem como capa.
        if (e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth <= 120) {
          setIndex((i) => i + 1);
        }
      }}
      className={cn(
        "object-cover",
        cropLetterbox && current.yt && "scale-[1.34]",
        className
      )}
    />
  );
}
