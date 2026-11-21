import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { CardGridSkeleton } from "@/components/layout/CardGridSkeleton";
import { Musicas } from "@/components/musicas/Musicas";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchMusicas } from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Músicas",
  "Sons e paródias da comunidade.",
  "/musicas"
);

export default function MusicasPage() {
  return (
    <PageTransition name="route-musicas">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="musicas"
          title="Músicas"
          description="Sons e paródias da comunidade."
        />
        <Suspense
          fallback={
            <SkeletonTransition name="skeleton-musicas">
              <CardGridSkeleton variant="music" count={8} />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <MusicasContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function MusicasContent() {
  const queryClient = getQueryClient();
  await queryClient.fetchQuery({
    queryKey: queryKeys.musicas.list(),
    queryFn: fetchMusicas,
  });

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Musicas />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
