"use client";

import Link from "next/link";
import { ViewTransition, type ComponentType, type RefAttributes } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
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
    <div className={cn("relative rounded-2xl border p-1.5", className)}>
      <GlowingEffect
        spread={36}
        glow
        disabled={false}
        proximity={48}
        inactiveZone={0.05}
        borderWidth={2}
      />
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        {...icon.handlers}
        className="relative flex h-full min-h-36 flex-col justify-between gap-6 overflow-hidden rounded-xl bg-card p-5 outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
      >
        <Icon
          ref={icon.ref}
          size={featured ? 28 : 22}
          aria-hidden
          className="text-primary"
        />
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
    </div>
  );
}
