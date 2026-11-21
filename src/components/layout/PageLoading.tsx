import { CardGridSkeleton, type CardGridVariant } from "@/components/layout/CardGridSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition, SkeletonTransition } from "@/components/layout/PageTransition";

/**
 * Skeleton de rota inteira (loading.tsx): exibe o cabeçalho real da seção
 * dentro da mesma `PageTransition` da página para evitar troca dupla de título,
 * deixando o skeleton apenas na área de conteúdo.
 */
export function PageLoading({
  slug,
  title,
  description,
  variant = "video",
  count,
}: {
  slug: string;
  title: string;
  description?: string;
  variant?: CardGridVariant;
  count?: number;
}) {
  return (
    <PageTransition name={`route-${slug}`}>
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader slug={slug} title={title} description={description} />
        <SkeletonTransition name={`skeleton-${slug}`}>
          <CardGridSkeleton variant={variant} count={count} />
        </SkeletonTransition>
      </div>
    </PageTransition>
  );
}
