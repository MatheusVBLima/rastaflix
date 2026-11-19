"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

interface ResultCountProps {
  shown: number;
  total: number;
  /** Singular e plural do item: ["história", "histórias"]. */
  noun: [string, string];
  className?: string;
}

/**
 * "12 de 140 histórias" enquanto há filtro; "140 histórias" sem filtro.
 * Os números animam com NumberFlow quando o filtro muda.
 */
export function ResultCount({ shown, total, noun, className }: ResultCountProps) {
  const filtered = shown !== total;
  const word = (filtered ? total : shown) === 1 ? noun[0] : noun[1];

  return (
    <p
      className={cn("text-sm tabular-nums text-muted-foreground", className)}
      aria-live="polite"
    >
      <NumberFlow value={shown} className="font-medium text-foreground" />
      {filtered && (
        <>
          {" de "}
          <NumberFlow value={total} />
        </>
      )}{" "}
      {word}
    </p>
  );
}
