"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/inimigos/Inimigos";
import { Thumb } from "@/components/cards/Thumb";

/**
 * Prévia com componentes reais do site (card, tags, botões, status, busca,
 * placar). Segue a paleta e o modo ativos na página.
 */
export function AppearancePreview({ label }: { label: string }) {
  // Um número que muda sozinho, para mostrar o NumberFlow na paleta escolhida.
  const [pct, setPct] = useState(19);
  useEffect(() => {
    const id = setInterval(() => setPct((v) => (v >= 80 ? 19 : v + 13)), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section aria-labelledby="previa" className="overflow-hidden rounded-2xl border bg-card">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 id="previa" className="text-sm font-semibold">
          Prévia
        </h2>
        <p className="text-xs text-muted-foreground">{label}</p>
      </header>

      <div className="space-y-5 p-5">
        <div className="flex h-10 items-center gap-2 rounded-lg border bg-background/60 px-3 text-sm text-muted-foreground">
          <Search className="size-4" aria-hidden />
          Buscar histórias
        </div>

        <article className="overflow-hidden rounded-xl border bg-background">
          <div className="relative aspect-video">
            <Thumb url={null} title="Rastaflix" sizes="320px" />
          </div>
          <div className="space-y-2 p-4">
            <p className="font-semibold leading-snug">Card de história</p>
            <p className="text-sm text-muted-foreground">Descrição em texto secundário.</p>
            <div className="flex gap-1.5 pt-1">
              <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground">#esculacho</span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">#modom</span>
            </div>
          </div>
        </article>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="vingado" />
          <StatusBadge status="pendente" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <NumberFlow value={pct} suffix="%" className="font-medium text-foreground" /> da vingança cumprida
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-warning/20">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" tabIndex={-1}>Botão principal</Button>
          <Button size="sm" variant="outline" tabIndex={-1}>Secundário</Button>
          <Button size="sm" variant="ghost" className="text-destructive" tabIndex={-1}>Excluir</Button>
        </div>
      </div>
    </section>
  );
}
