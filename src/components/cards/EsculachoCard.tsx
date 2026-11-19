"use client";

import { useState } from "react";
import type { Esculacho } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ClipAudio } from "@/components/audio/ClipAudio";

const LONG = 420;

/**
 * Card de esculacho em formato de citação: o texto é o protagonista,
 * com o autor como assinatura e o áudio logo abaixo.
 */
export function EsculachoCard({ esculacho }: { esculacho: Esculacho }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = esculacho.conteudo.length > LONG;

  return (
    <article className="flex h-full flex-col gap-5 rounded-xl border bg-card p-6 shadow-xs">
      <header className="space-y-1">
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight">
          {esculacho.titulo}
        </h3>
        {esculacho.descricao && (
          <p className="text-sm text-muted-foreground">{esculacho.descricao}</p>
        )}
      </header>

      <blockquote className="relative flex-1 border-l-2 border-primary pl-4">
        <p
          id={`esculacho-${esculacho.id}`}
          className={cn(
            "whitespace-pre-wrap text-[0.95rem] leading-relaxed",
            isLong && !expanded && "line-clamp-8"
          )}
        >
          {esculacho.conteudo}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`esculacho-${esculacho.id}`}
            className="mt-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {expanded ? "Recolher" : "Ler tudo"}
          </button>
        )}
        {esculacho.autor && (
          <footer className="mt-3 text-sm text-muted-foreground">
            — <cite className="not-italic font-medium text-foreground">{esculacho.autor}</cite>
          </footer>
        )}
      </blockquote>

      {esculacho.audio_url && (
        <ClipAudio
          id={esculacho.id}
          src={esculacho.audio_url}
          downloadName={esculacho.titulo}
        />
      )}
    </article>
  );
}
