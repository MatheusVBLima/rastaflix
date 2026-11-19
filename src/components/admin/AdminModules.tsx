"use client";

import Link from "next/link";
import type { ComponentType, RefAttributes } from "react";
import NumberFlow from "@number-flow/react";
import { ArrowRight } from "lucide-react";
import type { AdminCounts } from "@/lib/queries";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { BookTextIcon } from "@/components/icons/animated/book-text";
import { Disc3Icon } from "@/components/icons/animated/disc-3";
import { FlameIcon } from "@/components/icons/animated/flame";
import { ClapIcon } from "@/components/icons/animated/clap";
import { SparklesIcon } from "@/components/icons/animated/sparkles";
import { HandFistIcon } from "@/components/icons/animated/hand-fist";

type AnimatedIcon = ComponentType<
  { size?: number; className?: string; "aria-hidden"?: boolean } & RefAttributes<AnimatedIconHandle>
>;

interface ModuleDef {
  key: keyof AdminCounts;
  title: string;
  href: string;
  icon: AnimatedIcon;
  hint?: string;
  unit: [string, string];
}

const MODULES: ModuleDef[] = [
  { key: "historias", title: "Histórias", href: "/admin/historias", icon: BookTextIcon, unit: ["história", "histórias"] },
  { key: "musicas", title: "Músicas", href: "/admin/musicas", icon: Disc3Icon, unit: ["música", "músicas"] },
  { key: "esculachos", title: "Esculachos", href: "/admin/esculachos", icon: FlameIcon, hint: "Texto e áudio", unit: ["esculacho", "esculachos"] },
  { key: "clipes", title: "Clipes", href: "/admin/clipes", icon: ClapIcon, unit: ["clipe", "clipes"] },
  { key: "inimigos", title: "Inimigos", href: "/admin/inimigos", icon: HandFistIcon, unit: ["inimigo", "inimigos"] },
  { key: "seasons", title: "Rasta Awards", href: "/admin/rasta-awards", icon: SparklesIcon, hint: "Temporadas, categorias e indicados", unit: ["temporada", "temporadas"] },
];

export function AdminModules({ counts }: { counts?: AdminCounts }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((m) => (
        <ModuleLink
          key={m.href}
          title={m.title}
          href={m.href}
          icon={m.icon}
          hint={m.hint}
          count={counts?.[m.key]}
          unit={m.unit}
        />
      ))}
    </ul>
  );
}

function ModuleLink({
  title,
  href,
  icon: Icon,
  hint,
  count,
  unit,
}: {
  title: string;
  href: string;
  icon: AnimatedIcon;
  hint?: string;
  count?: number;
  unit: [string, string];
}) {
  const icon = useAnimatedIcon<AnimatedIconHandle>();
  return (
    <li>
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        {...icon.handlers}
        className="group flex h-full items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon ref={icon.ref} size={24} aria-hidden className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="block font-semibold">{title}</span>
          {hint ? (
            <span className="block truncate text-sm text-muted-foreground">{hint}</span>
          ) : typeof count === "number" ? (
            <span className="block text-sm tabular-nums text-muted-foreground">
              <NumberFlow value={count} /> {count === 1 ? unit[0] : unit[1]}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {hint && typeof count === "number" && (
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
              <NumberFlow value={count} />
            </span>
          )}
          <ArrowRight
            className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </li>
  );
}
