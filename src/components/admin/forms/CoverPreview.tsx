"use client";

import { Thumb } from "@/components/cards/Thumb";

/** Prévia da capa como ela vai aparecer no site (mesmo fallback dos cards). */
export function CoverPreview({
  url,
  imageUrl,
  title,
  square,
}: {
  url?: string | null;
  imageUrl?: string | null;
  title: string;
  square?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Capa</p>
      <div
        className={
          square
            ? "relative aspect-square w-40 overflow-hidden rounded-lg border bg-muted"
            : "relative aspect-video w-full overflow-hidden rounded-lg border bg-muted"
        }
      >
        <Thumb
          key={`${url}|${imageUrl}`}
          url={url}
          fallbackSrc={imageUrl}
          title={title || "Sem título"}
          sizes="400px"
          cropLetterbox={square}
        />
      </div>
    </div>
  );
}
