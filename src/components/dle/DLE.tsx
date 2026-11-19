"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import twemoji from "twemoji";
import { Check, Lock, X } from "lucide-react";
import { historias } from "@/data/dle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { celebrate, celebrateText } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

type BotaoEstado = "Verificar" | "Próxima fase" | "Fim das histórias";
type TentativasPorFase = Record<number, number>;

const MAX_EMOJIS = 5;

function removerAcentuacao(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function DLE() {
  const [historiaAtual, setHistoriaAtual] = useState(0);
  const [emojisVisiveis, setEmojisVisiveis] = useState(1);
  const [palpite, setPalpite] = useState("");
  const [tentativas, setTentativas] = useState<string[]>([]);
  const [acertou, setAcertou] = useState(false);
  const [palpiteCorreto, setPalpiteCorreto] = useState<string | null>(null);
  const [botao, setBotao] = useState<BotaoEstado>("Verificar");
  const [tentativasPorFase, setTentativasPorFase] = useState<TentativasPorFase>({});
  const [fasesCompletas, setFasesCompletas] = useState<number[]>([]);
  const [emojisReveladosPorFase, setEmojisReveladosPorFase] = useState<Record<number, number>>({});

  const botaoRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const placarRef = useRef<HTMLOListElement>(null);

  const historia = historias[historiaAtual];
  const ultimaFase = historiaAtual === historias.length - 1;

  useEffect(() => {
    for (const el of [emojiContainerRef.current, placarRef.current]) {
      if (el) twemoji.parse(el, { folder: "svg", ext: ".svg", className: "emoji" });
    }
  }, [emojisVisiveis, historiaAtual, fasesCompletas]);

  useEffect(() => {
    if (botao === "Próxima fase") botaoRef.current?.focus();
    if (botao === "Verificar") inputRef.current?.focus({ preventScroll: true });
  }, [botao]);

  function proximaFase() {
    setHistoriaAtual((i) => (i + 1) % historias.length);
    setEmojisVisiveis(1);
    setPalpite("");
    setTentativas([]);
    setAcertou(false);
    setPalpiteCorreto(null);
    setBotao("Verificar");
  }

  function reiniciarDoZero() {
    setHistoriaAtual(0);
    setEmojisVisiveis(1);
    setPalpite("");
    setTentativas([]);
    setAcertou(false);
    setPalpiteCorreto(null);
    setBotao("Verificar");
    setTentativasPorFase({});
    setFasesCompletas([]);
    setEmojisReveladosPorFase({});
  }

  function verificarPalpite() {
    if (botao === "Próxima fase") return proximaFase();
    if (botao === "Fim das histórias" || !palpite.trim()) return;

    const palavras = removerAcentuacao(palpite.toLowerCase()).split(/\s+/);
    const correto = historia.palavrasChave?.some((grupo) =>
      grupo.every((p) => palavras.includes(removerAcentuacao(p.toLowerCase())))
    );

    if (correto) {
      setAcertou(true);
      setPalpiteCorreto(palpite);
      setBotao(ultimaFase ? "Fim das histórias" : "Próxima fase");
      setTentativasPorFase((prev) => ({ ...prev, [historiaAtual]: tentativas.length + 1 }));
      setEmojisReveladosPorFase((prev) => ({ ...prev, [historiaAtual]: emojisVisiveis }));
      if (!fasesCompletas.includes(historiaAtual)) {
        setFasesCompletas((prev) => [...prev, historiaAtual]);
      }
      if (ultimaFase) void celebrateText("ZEROU", "#16a34a");
      else void celebrate();
    } else {
      if (emojisVisiveis < MAX_EMOJIS) setEmojisVisiveis(emojisVisiveis + 1);
      setTentativas([palpite, ...tentativas]);
    }
    setPalpite("");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Jogo */}
      <section
        aria-labelledby="dle-pergunta"
        className="flex flex-col items-center gap-8 rounded-2xl border bg-card p-6 sm:p-10 lg:col-span-2"
      >
        <div className="space-y-2 text-center">
          <p className="font-mono text-sm tabular-nums text-muted-foreground">
            Fase {historiaAtual + 1} de {historias.length}
          </p>
          <h2 id="dle-pergunta" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Qual história esses emojis contam?
          </h2>
          <p className="text-sm text-muted-foreground">
            A resposta tem pelo menos duas palavras. Cada erro revela mais um emoji.
          </p>
        </div>

        {/* Emojis: os não revelados aparecem como espaços vazios */}
        <div ref={emojiContainerRef} className="flex justify-center gap-2 sm:gap-4" aria-live="polite">
          {Array.from({ length: MAX_EMOJIS }).map((_, i) => {
            const emoji = historia.emojis[i];
            const visible = i < emojisVisiveis || acertou;
            return (
              <div
                key={`${historiaAtual}-${i}`}
                className={cn(
                  "flex size-14 items-center justify-center rounded-xl text-4xl sm:size-20 sm:text-5xl [&_img.emoji]:size-9 sm:[&_img.emoji]:size-12",
                  visible ? "bg-muted/60" : "border-2 border-dashed border-muted"
                )}
              >
                <AnimatePresence>
                  {visible && emoji && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    >
                      {emoji}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verificarPalpite();
          }}
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="dle-palpite" className="sr-only">
            Seu palpite
          </label>
          <Input
            ref={inputRef}
            id="dle-palpite"
            value={botao === "Verificar" ? palpite : ""}
            onChange={(e) => setPalpite(e.target.value)}
            placeholder="Nome da história"
            disabled={botao !== "Verificar"}
            autoComplete="off"
            className="h-11"
          />
          {botao === "Fim das histórias" ? (
            <Button type="button" onClick={reiniciarDoZero} className="h-11">
              Jogar de novo
            </Button>
          ) : (
            <Button ref={botaoRef} type="submit" className="h-11 min-w-32">
              {botao}
            </Button>
          )}
        </form>

        {/* Resultado da fase */}
        {acertou && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4"
          >
            <p className="flex items-center justify-center gap-2 font-medium text-success">
              <Check className="size-5" aria-hidden />
              Acertou com “{palpiteCorreto}”
            </p>
            <div className="mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-xl border">
              <iframe
                src={historia.iframe}
                title="Vídeo da história"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="size-full"
              />
            </div>
          </motion.div>
        )}

        {tentativas.length > 0 && !acertou && (
          <ul className="w-full max-w-md space-y-2" aria-label="Palpites errados">
            <AnimatePresence initial={false}>
              {tentativas.map((t, i) => (
                <motion.li
                  key={`${tentativas.length - i}-${t}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
                >
                  <X className="size-4 shrink-0 text-destructive" aria-hidden />
                  <span className="truncate">{t}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {/* Placar */}
      <aside aria-labelledby="dle-placar" className="space-y-4 rounded-2xl border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 id="dle-placar" className="font-semibold">
            Placar
          </h2>
          <p className="font-display text-2xl font-semibold tabular-nums">
            <NumberFlow value={fasesCompletas.length} />
            <span className="text-muted-foreground">/{historias.length}</span>
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${(fasesCompletas.length / historias.length) * 100}%` }}
          />
        </div>

        <ol ref={placarRef} className="space-y-2">
          {historias.map((h, index) => {
            const atual = index === historiaAtual;
            const completa = fasesCompletas.includes(index);
            const revelados = atual
              ? h.emojis.slice(0, emojisVisiveis)
              : completa
                ? h.emojis.slice(0, emojisReveladosPorFase[index] || MAX_EMOJIS)
                : [];

            return (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2",
                  atual && "border-primary/60 bg-primary/5"
                )}
              >
                <span className="w-5 font-mono text-xs tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="flex flex-1 gap-1 text-lg [&_img.emoji]:size-5">
                  {completa || atual ? (
                    revelados.map((e, i) => <span key={i}>{e}</span>)
                  ) : (
                    <Lock className="size-4 text-muted-foreground/60" aria-label="Bloqueada" />
                  )}
                </span>
                {completa && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {tentativasPorFase[index]}{" "}
                    {tentativasPorFase[index] === 1 ? "tentativa" : "tentativas"}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
