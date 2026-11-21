"use client";

import Link from "next/link";
import { ViewTransition, type ComponentType, type RefAttributes } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { cn } from "@/lib/utils";

type AnimatedIcon = ComponentType<
  { size?: number; className?: string; "aria-hidden"?: boolean } & RefAttributes<AnimatedIconHandle>
>;

interface SectionTileProps {
  href: string;
  slug: string;
  title: string;
  description?: string;
  icon: AnimatedIcon;
  featured?: boolean;
  className?: string;
}

/**
 * Card de seção da home. O título tem o mesmo nome de ViewTransition do
 * cabeçalho da página de destino, então "voa" até lá ao navegar.
 */
export function SectionTile({
  href,
  slug,
  title,
  description,
  icon: Icon,
  featured,
  className,
}: SectionTileProps) {
  const icon = useAnimatedIcon<AnimatedIconHandle>();

  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      {...icon.handlers}
      className={cn(
        "group relative flex h-full min-h-36 flex-col justify-between gap-6 overflow-hidden rounded-xl border bg-card p-5 outline-none transition-[border-color,background-color] duration-150 ease-out hover:border-foreground/20 hover:bg-accent/35 focus-visible:ring-2 focus-visible:ring-ring sm:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Icon
          ref={icon.ref}
          size={featured ? 28 : 22}
          aria-hidden
          className="text-primary"
        />
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground/60 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
        />
      </div>
      <div className="space-y-2">
        <ViewTransition name={`page-title-${slug}`} share="morph" default="none">
          <h2
            className={cn(
              "w-fit font-display font-semibold leading-none tracking-tight",
              featured ? "text-4xl sm:text-5xl" : "text-2xl"
            )}
          >
            {title}
          </h2>
        </ViewTransition>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </Link>
  );
}
