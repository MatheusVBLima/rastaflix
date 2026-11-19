import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de busca e filtros que acompanha o scroll logo abaixo do header fixo (h-16),
 * permitindo que o título e a descrição da página subam normalmente enquanto os filtros
 * continuam sempre acessíveis.
 */
export function StickyFilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-bar glass-bar-sub sticky top-16 z-40 w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] py-3",
        "[&_input]:bg-card/90 [&_[data-slot=select-trigger]]:bg-card/90",
        className
      )}
    >
      <div className="container mx-auto flex flex-col gap-3 px-4 sm:flex-row sm:items-center md:px-6">
        {children}
      </div>
    </div>
  );
}
