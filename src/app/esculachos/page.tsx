import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { CardGridSkeleton } from "@/components/layout/CardGridSkeleton";
import { Esculachos } from "@/components/esculachos/Esculachos";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchEsculachos } from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Esculachos",
  "Trechos da live para ouvir e baixar.",
  "/esculachos"
);

export default function EsculachosPage() {
  return (
    <PageTransition name="route-esculachos">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="esculachos"
          title="Esculachos"
          description="Trechos da live para ouvir e baixar."
        />
        <Suspense
          fallback={
            <SkeletonTransition name="skeleton-esculachos">
              <CardGridSkeleton variant="quote" count={4} />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <EsculachosContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function EsculachosContent() {
  const queryClient = getQueryClient();
  await queryClient.fetchQuery({
    queryKey: queryKeys.esculachos.list(),
    queryFn: fetchEsculachos,
  });

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Esculachos />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
