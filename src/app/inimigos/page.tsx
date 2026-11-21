import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { Inimigos } from "@/components/inimigos/Inimigos";
import { InimigosSkeleton } from "@/components/inimigos/InimigosSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchInimigos } from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Mural de Inimigos",
  "Conheça os antagonistas dessa jornada rastafari.",
  "/inimigos"
);

export default function InimigosPage() {
  return (
    <PageTransition name="route-inimigos">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="inimigos"
          title="Mural de Inimigos"
          description="Os antagonistas dessa jornada rastafari."
        />
        <Suspense
          fallback={
            <SkeletonTransition name="skeleton-inimigos">
              <InimigosSkeleton />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <InimigosContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function InimigosContent() {
  const queryClient = getQueryClient();
  await queryClient.fetchQuery({
    queryKey: queryKeys.inimigos.list(),
    queryFn: fetchInimigos,
  });

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Inimigos />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
