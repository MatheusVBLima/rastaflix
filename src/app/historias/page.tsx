import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { CardGridSkeleton } from "@/components/layout/CardGridSkeleton";
import { Historias } from "@/components/historias/Historias";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchHistorias, getAllTags } from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Histórias",
  "Histórias que o dog tenta esconder - explore, filtre e compartilhe.",
  "/historias"
);

export default function HistoriasPage() {
  return (
    <PageTransition name="route-historias">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="historias"
          title="Histórias"
          description="Histórias que o dog tenta esconder."
        />
        <Suspense
          fallback={
            <SkeletonTransition name="skeleton-historias">
              <CardGridSkeleton variant="video" />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <HistoriasContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function HistoriasContent() {
  const queryClient = getQueryClient();
  const historias = await queryClient.fetchQuery({
    queryKey: queryKeys.historias.list(),
    queryFn: fetchHistorias,
  });
  const tags = await getAllTags(historias);

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Historias tags={tags} />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
