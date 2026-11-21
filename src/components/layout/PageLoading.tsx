import { CardGridSkeleton, type CardGridVariant } from "@/components/layout/CardGridSkeleton";
import { SkeletonTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton de rota inteira (loading.tsx): cabeçalho + grade no formato da seção. */
export function PageLoading({
  variant = "video",
  count,
  hasDescription = true,
}: {
  variant?: CardGridVariant;
  count?: number;
  hasDescription?: boolean;
}) {
  return (
    <SkeletonTransition>
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <div className="space-y-3 border-b pb-6">
          <Skeleton className="h-9 w-64 max-w-full sm:h-12 md:h-14" />
          {hasDescription && <Skeleton className="h-5 w-80 max-w-full" />}
        </div>
        <CardGridSkeleton variant={variant} count={count} />
      </div>
    </SkeletonTransition>
  );
}
