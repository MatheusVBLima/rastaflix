import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Variant = "video" | "music" | "quote";

const GRID: Record<Variant, string> = {
  video: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  music: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  quote: "grid-cols-1 lg:grid-cols-2",
};

/**
 * Skeleton no formato real dos cards de cada seção, para não haver salto de
 * layout quando o conteúdo chega.
 */
export function CardGridSkeleton({
  variant = "video",
  count = 6,
  toolbar = true,
}: {
  variant?: Variant;
  count?: number;
  toolbar?: boolean;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando">
      {toolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-4 w-28 sm:ml-auto" />
        </div>
      )}
      <div className={cn("grid gap-6", GRID[variant])}>
        {Array.from({ length: count }).map((_, i) =>
          variant === "music" ? (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-[88%] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : variant === "quote" ? (
            <div key={i} className="space-y-4 rounded-xl border p-6">
              <Skeleton className="h-5 w-1/2" />
              <div className="space-y-2 border-l-2 border-muted pl-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          ) : (
            <div key={i} className="overflow-hidden rounded-xl border">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-1.5 pt-2">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
