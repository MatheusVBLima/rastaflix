"use client";

import type { Story } from "@/lib/types";
import { getHostLabel } from "@/lib/media";
import { Thumb } from "./Thumb";
import { CopyLinkButton } from "./CopyLinkButton";
import { cn } from "@/lib/utils";

interface StoryCardProps {
  story: Story;
  activeTag?: string;
  onTagClick?: (tag: string) => void;
  priority?: boolean;
}

/**
 * Card de história. O link cobre o card inteiro (stretched link), e as tags
 * ficam por cima como botões que filtram a lista.
 */
export function StoryCard({ story, activeTag, onTagClick, priority }: StoryCardProps) {
  const host = getHostLabel(story.url);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/50 hover:shadow-md focus-within:border-primary/50">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Thumb
          url={story.url}
          fallbackSrc={story.imageUrl}
          title={story.title}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CopyLinkButton
          url={story.url}
          label={`Copiar link de ${story.title}`}
          className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug">
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {story.title}
            {host && <span className="sr-only"> (abre no {host})</span>}
          </a>
        </h3>

        {story.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {story.description}
          </p>
        )}

        {story.tags.length > 0 && (
          <ul className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-2">
            {story.tags.map((tag) => {
              const active = activeTag === tag;
              return (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => onTagClick?.(tag)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    #{tag}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
