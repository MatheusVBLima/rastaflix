"use client";

import { DotmSquare3 } from "@/components/ui/dotm-square-3";
import { DotmCircular5 } from "@/components/ui/dotm-circular-5";
import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Texto lido por leitores de tela e, com `showLabel`, exibido ao lado. */
  label?: string;
  showLabel?: boolean;
  size?: number;
  className?: string;
}

/**
 * Loader compacto de matriz de pontos para feedbacks pontuais/inline.
 * Para páginas, tabelas e painéis de conteúdo, prefira skeletons fiéis ao layout.
 */
export function Loader({
  label = "Carregando",
  showLabel = false,
  size = 36,
  className,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-3 text-primary",
        className
      )}
    >
      <DotmSquare3 size={size} dotSize={Math.max(3, Math.round(size / 7))} ariaLabel={label} />
      {showLabel ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

/**
 * Versão compacta para dentro de botões ("Salvando", "Excluindo").
 * Herda a cor do texto do botão.
 */
export function ButtonLoader({
  label = "Carregando",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <DotmCircular5
      size={16}
      dotSize={2}
      ariaLabel={label}
      className={cn("shrink-0", className)}
    />
  );
}
