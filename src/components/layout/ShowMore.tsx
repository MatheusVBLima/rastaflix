"use client";

import { Button } from "@/components/ui/button";

interface ShowMoreProps {
  shown: number;
  total: number;
  onMore: () => void;
}

/** Botão "Mostrar mais" para grades longas. Some quando tudo já aparece. */
export function ShowMore({ shown, total, onMore }: ShowMoreProps) {
  if (shown >= total) return null;
  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" onClick={onMore} className="min-w-48">
        Mostrar mais
        <span className="tabular-nums text-muted-foreground">
          {total - shown}
        </span>
      </Button>
    </div>
  );
}
