"use client";

import Link from "next/link";
import type { ComponentType, RefAttributes } from "react";
import NumberFlow from "@number-flow/react";
import { ArrowUpRight } from "lucide-react";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { BookTextIcon } from "@/components/icons/animated/book-text";
import { Disc3Icon } from "@/components/icons/animated/disc-3";
import { FlameIcon } from "@/components/icons/animated/flame";
import { ClapIcon } from "@/components/icons/animated/clap";
import { SparklesIcon } from "@/components/icons/animated/sparkles";
import { HandFistIcon } from "@/components/icons/animated/hand-fist";
import { UsersIcon } from "@/components/icons/animated/users";

type AnimatedIcon = ComponentType<
  { size?: number; className?: string; "aria-hidden"?: boolean } & RefAttributes<AnimatedIconHandle>
>;

export interface AdminModuleCounts {
  usuarios: number;
  historias: number;
  musicas: number;
  esculachos: number;
  clipes: number;
  inimigos: number;
  seasons: number;
}

interface ModuleDef {
  key: keyof AdminModuleCounts;
  title: string;
  href: string;
  icon: AnimatedIcon;
  unit: [string, string];
}

const MODULES: ModuleDef[] = [
  { key: "usuarios", title: "Usuários", href: "/admin/usuarios", icon: UsersIcon, unit: ["conta", "contas"] },
  { key: "historias", title: "Histórias", href: "/admin/historias", icon: BookTextIcon, unit: ["história", "histórias"] },
  { key: "musicas", title: "Músicas", href: "/admin/musicas", icon: Disc3Icon, unit: ["música", "músicas"] },
  { key: "esculachos", title: "Esculachos", href: "/admin/esculachos", icon: FlameIcon, unit: ["esculacho", "esculachos"] },
  { key: "clipes", title: "Clipes", href: "/admin/clipes", icon: ClapIcon, unit: ["clipe", "clipes"] },
  { key: "inimigos", title: "Inimigos", href: "/admin/inimigos", icon: HandFistIcon, unit: ["inimigo", "inimigos"] },
  { key: "seasons", title: "Rasta Awards", href: "/admin/rasta-awards", icon: SparklesIcon, unit: ["temporada", "temporadas"] },
];

/** Atalhos para cada área de gestão, com a contagem atual. */
export function AdminModules({ counts }: { counts: AdminModuleCounts }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
      {MODULES.map((m) => (
        <ModuleLink key={m.href} def={m} count={counts[m.key]} />
      ))}
    </ul>
  );
}

function ModuleLink({ def, count }: { def: ModuleDef; count: number }) {
  const { title, href, icon: Icon, unit } = def;
  const icon = useAnimatedIcon<AnimatedIconHandle>();
  return (
    <li>
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        {...icon.handlers}
        className="group flex h-full flex-col justify-between gap-3 rounded-lg border bg-background/40 p-3.5 transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center justify-between">
          <Icon ref={icon.ref} size={20} aria-hidden className="text-primary" />
          <ArrowUpRight
            className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
        <span className="space-y-0.5">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs tabular-nums text-muted-foreground">
            <NumberFlow value={count} /> {count === 1 ? unit[0] : unit[1]}
          </span>
        </span>
      </Link>
    </li>
  );
}
