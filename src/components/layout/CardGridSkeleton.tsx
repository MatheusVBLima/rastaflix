import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type CardGridVariant = "video" | "music" | "quote" | "clip";

const GRID: Record<CardGridVariant, string> = {
  video: "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
  clip: "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
  music: "grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4",
  quote: "grid-cols-1 gap-6 lg:grid-cols-2",
};

/**
 * Skeleton no formato real dos cards e da barra de filtros de cada seção,
 * para não haver salto de layout quando o conteúdo chega.
 */
export function CardGridSkeleton({
  variant = "video",
  count = 6,
  toolbar = true,
}: {
  variant?: CardGridVariant;
  count?: number;
  toolbar?: boolean;
}) {
  return (
    <div
      className={variant === "music" ? "space-y-8" : "space-y-6"}
      aria-busy="true"
      aria-label="Carregando"
    >
      {toolbar && (
        <div className="mx-[calc(50%-50vw)] border-b px-[calc(50vw-50%)] py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full sm:max-w-sm" />
            {variant === "video" && <Skeleton className="h-10 w-full sm:w-48" />}
            {variant === "clip" ? (
              <div className="inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1 sm:ml-auto">
                <Skeleton className="h-8 w-20 rounded-md bg-background/80" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ) : (
              <Skeleton className="h-4 w-28 sm:ml-auto" />
            )}
          </div>
        </div>
      )}

      <div className={cn("grid", GRID[variant])}>
        {Array.from({ length: count }).map((_, i) =>
          variant === "music" ? (
            <div key={i} className="grid gap-4">
              <div className="relative w-full" style={{ aspectRatio: "1.14 / 1" }}>
                <div
                  aria-hidden
                  className="absolute inset-y-[4%] right-0 aspect-square rounded-full bg-muted/60"
                />
                <Skeleton className="absolute inset-y-0 left-0 aspect-square rounded-lg" />
              </div>
              <Skeleton className="h-5 w-3/4" />
            </div>
          ) : variant === "quote" ? (
            <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
              <Skeleton className="h-5 w-1/2" />
              <div className="space-y-2 border-l-2 border-muted pl-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          ) : variant === "clip" ? (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
          ) : (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-1.5 pt-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
