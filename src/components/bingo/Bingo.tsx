"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import { bingoItems } from "@/data/bingo";
import { Button } from "@/components/ui/button";
import { RotateCCWIcon } from "@/components/icons/animated/rotate-ccw";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { celebrate, celebrateText } from "@/lib/celebrate";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bingo_rastafari";
const SIZE = 4; // cartela 4x4

/** Linhas que valem "bingo": 4 linhas, 4 colunas e 2 diagonais. */
const LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < SIZE; r++) lines.push([0, 1, 2, 3].map((c) => r * SIZE + c));
  for (let c = 0; c < SIZE; c++) lines.push([0, 1, 2, 3].map((r) => r * SIZE + c));
  lines.push([0, 5, 10, 15], [3, 6, 9, 12]);
  return lines;
})();

function BingoCell({
  text,
  checked,
  inLine,
  onToggle,
}: {
  text: string;
  checked: boolean;
  inLine: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="group relative aspect-square rounded-lg outline-none [perspective:800px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <motion.span
        className="absolute inset-0 block [transform-style:preserve-3d]"
        animate={{ rotateY: checked ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Frente */}
        <span className="absolute inset-0 flex items-center justify-center rounded-lg border bg-card p-1.5 text-center text-[0.6rem] font-semibold uppercase leading-tight tracking-wide text-card-foreground shadow-xs transition-colors [backface-visibility:hidden] group-hover:border-primary/50 sm:p-3 sm:text-xs md:text-sm">
          {text}
        </span>
        {/* Verso (marcado) */}
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-primary p-1.5 text-center text-[0.6rem] font-semibold uppercase leading-tight tracking-wide text-primary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-3 sm:text-xs md:text-sm",
            inLine && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
          )}
        >
          <Check className="size-3.5 sm:size-4" aria-hidden />
          {text}
        </span>
      </motion.span>
    </button>
  );
}

export function Bingo() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const reset = useAnimatedIcon<AnimatedIconHandle>();
  const prevLines = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      /* sem storage: começa vazio */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked, loaded]);

  const marked = bingoItems.filter((i) => checked[i.id]).length;
  const total = bingoItems.length;

  const completedLines = useMemo(
    () => LINES.filter((line) => line.every((idx) => checked[bingoItems[idx]?.id])),
    [checked]
  );
  const cellsInLine = useMemo(() => new Set(completedLines.flat()), [completedLines]);

  // Comemora quando fecha uma linha nova, e com "BINGO" ao completar a cartela.
  useEffect(() => {
    if (!loaded) return;
    const count = completedLines.length;
    if (prevLines.current !== null) {
      if (marked === total) void celebrateText("BINGO", "#16a34a");
      else if (count > prevLines.current) void celebrate();
    }
    prevLines.current = count;
  }, [completedLines.length, loaded, marked, total]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-muted-foreground">Marcados</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">
              <NumberFlow value={loaded ? marked : 0} />
              <span className="text-muted-foreground">/{total}</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Linhas</dt>
            <dd className="font-display text-3xl font-semibold tabular-nums">
              <NumberFlow value={completedLines.length} />
            </dd>
          </div>
        </dl>

        <Button
          variant="outline"
          onClick={() => setChecked({})}
          disabled={marked === 0}
          {...reset.handlers}
        >
          <RotateCCWIcon ref={reset.ref} size={16} aria-hidden />
          Limpar cartela
        </Button>
      </div>

      <div
        className={cn(
          "grid grid-cols-4 gap-2 rounded-2xl border bg-muted/30 p-2 transition-opacity sm:gap-3 sm:p-4",
          !loaded && "opacity-0"
        )}
      >
        {bingoItems.slice(0, SIZE * SIZE).map((item, idx) => (
          <BingoCell
            key={item.id}
            text={item.text}
            checked={!!checked[item.id]}
            inLine={cellsInLine.has(idx)}
            onToggle={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
          />
        ))}
      </div>
    </div>
  );
}
