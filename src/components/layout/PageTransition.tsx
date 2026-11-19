import { ViewTransition, type ReactNode } from "react";

/**
 * Transição de rota no nível da página.
 *
 * - `nav-forward` (home → seção): desliza para a esquerda, com o título
 *   fazendo morph a partir do card da home.
 * - `nav-back` (logo → home): desliza para a direita.
 * - sem tipo (menu entre seções, que são irmãs): cross-fade.
 *
 * Precisa ser o primeiro elemento retornado pela página (antes de qualquer DOM).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-in" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-out" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/** Conteúdo que chega depois do skeleton (Suspense). */
export function RevealTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="slide-up" default="none">
      {children}
    </ViewTransition>
  );
}

/** Skeleton que sai quando o conteúdo chega. */
export function SkeletonTransition({ children }: { children: ReactNode }) {
  return <ViewTransition exit="slide-down">{children}</ViewTransition>;
}
