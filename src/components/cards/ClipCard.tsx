"use client";

import { Thumb } from "./Thumb";
import type { Clipe } from "@/lib/types";
import { TwitchLogo } from "@/components/icons/TwitchLogo";
import { KickLogo } from "@/components/icons/KickLogo";
import { CopyLinkButton } from "./CopyLinkButton";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLATFORM = {
  twitch: {
    label: "Twitch",
    className: "bg-[#9146FF] text-white",
    Logo: TwitchLogo,
  },
  kick: {
    label: "Kick",
    className: "bg-[#53FC18] text-black",
    Logo: KickLogo,
  },
} as const;

export function ClipCard({ clipe, priority }: { clipe: Clipe; priority?: boolean }) {
  const platform = PLATFORM[clipe.plataforma as keyof typeof PLATFORM];
  const when = formatRelative(clipe.created_at);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/50 hover:shadow-md focus-within:border-primary/50">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Thumb
          url={clipe.url}
          fallbackSrc={clipe.thumbnail_url}
          title={clipe.titulo}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-75"
        />

        {/* Play no hover */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.7-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </div>

        {platform && (
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-semibold",
              platform.className
            )}
          >
            <platform.Logo className="h-3 w-auto" />
            <span className="sr-only">{platform.label}</span>
          </span>
        )}

        <CopyLinkButton
          url={clipe.url}
          label={`Copiar link de ${clipe.titulo}`}
          className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">
          <a
            href={clipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {clipe.titulo}
          </a>
        </h3>
        {when && (
          <p className="mt-auto text-xs text-muted-foreground">
            <time dateTime={clipe.created_at} suppressHydrationWarning>{when}</time>
          </p>
        )}
      </div>
    </article>
  );
}
