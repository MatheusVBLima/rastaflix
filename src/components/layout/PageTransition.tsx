import { ViewTransition, type ReactNode } from "react";

/**
 * Transição de rota no nível da página.
 *
 * - `nav-forward` (home → seção): desliza para a esquerda, com o título
 *   fazendo morph a partir do card da home.
 * - `nav-back` (logo → home): desliza para a direita.
 * - sem tipo (menu entre seções irmãs): saída completa antes da entrada,
 *   para que os títulos de duas páginas nunca fiquem sobrepostos.
 * - `name` compartilhado entre `loading.tsx` e `page.tsx` da mesma rota com
 *   `share="none"` evita repetir a animação de página quando o carregamento termina.
 *
 * Precisa ser o primeiro elemento retornado pela página (antes de qualquer DOM).
 */
export function PageTransition({
  name,
  children,
}: {
  name?: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition
      name={name}
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-in" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-out" }}
      share="none"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/** Conteúdo que chega depois do skeleton (Suspense). */
export function RevealTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="content-in" default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * Skeleton que sai quando o conteúdo chega.
 * `enter="none"` garante que o skeleton entre junto com a página pai, sem
 * criar um cross-fade concorrente por cima da rota anterior.
 */
export function SkeletonTransition({
  name,
  children,
}: {
  name?: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition name={name} enter="none" exit="skeleton-out" share="none" default="none">
      {children}
    </ViewTransition>
  );
}
