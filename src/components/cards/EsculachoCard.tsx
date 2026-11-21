"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Esculacho } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClipAudio } from "@/components/audio/ClipAudio";

const LONG = 420;

/**
 * Card de esculacho em formato de citação: o texto é o protagonista,
 * com o autor como assinatura e o áudio logo abaixo.
 */
export function EsculachoCard({ esculacho }: { esculacho: Esculacho }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = esculacho.conteudo.length > LONG;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(esculacho.conteudo);
      setCopied(true);
      toast.success("Texto copiado");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar o texto");
    }
  }

  return (
    <article className="flex h-full flex-col gap-5 rounded-xl border bg-card p-6 shadow-xs">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight">
            {esculacho.titulo}
          </h3>
          {esculacho.descricao && (
            <p className="text-sm text-muted-foreground">{esculacho.descricao}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label={`Copiar texto de ${esculacho.titulo}`}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </Button>
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
            Por <cite className="not-italic font-medium text-foreground">{esculacho.autor}</cite>
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
