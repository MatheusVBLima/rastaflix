import { ViewTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  /** Usado para o morph do título vindo da home (`page-title-<slug>`). */
  slug?: string;
  description?: string;
  /** Conteúdo à direita do título (ações, contadores). */
  aside?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho das páginas de conteúdo. O título usa a fonte display e,
 * quando há `slug`, participa do morph com o card correspondente da home.
 */
export function PageHeader({
  title,
  slug,
  description,
  aside,
  className,
}: PageHeaderProps) {
  const heading = (
    <h1 className="w-fit font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
      {title}
    </h1>
  );

  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="space-y-3">
        {slug ? (
          <ViewTransition name={`page-title-${slug}`} share="morph" default="none">
            {heading}
          </ViewTransition>
        ) : (
          heading
        )}
        {description && (
          <p className="max-w-prose text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}
