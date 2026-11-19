import { Moon, Sun } from "lucide-react";
import type { PaletteId } from "@/lib/palettes";

/**
 * Miniatura de uma tela do site numa paleta e modo específicos.
 * Usa data-palette/data-mode, então mostra as cores reais do globals.css
 * independentemente do tema ativo na página.
 */
export function PaletteMockup({ palette, mode }: { palette: PaletteId; mode: "light" | "dark" }) {
  const Icon = mode === "light" ? Sun : Moon;
  return (
    <div
      data-palette={palette}
      data-mode={mode}
      aria-hidden
      className="flex h-full min-w-0 flex-1"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* barra lateral */}
      <div className="flex w-5 shrink-0 flex-col items-center gap-1.5 pt-3" style={{ background: "var(--muted)" }}>
        <span className="size-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        <span className="h-0.5 w-2.5 rounded-full" style={{ background: "var(--border)" }} />
        <span className="h-0.5 w-2.5 rounded-full" style={{ background: "var(--border)" }} />
      </div>
      {/* conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="h-1.5 w-3/5 rounded-full" style={{ background: "var(--foreground)", opacity: 0.25 }} />
          <Icon className="size-2.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
        </div>
        <span className="h-1.5 w-2/5 rounded-full" style={{ background: "var(--foreground)", opacity: 0.15 }} />
        <div className="mt-auto flex items-center gap-1.5">
          <span className="h-3 w-10 rounded-full" style={{ background: "var(--primary)" }} />
          <span
            className="h-3 w-6 rounded-full"
            style={{ background: "var(--accent)", border: "1px solid var(--border)" }}
          />
        </div>
      </div>
    </div>
  );
}
