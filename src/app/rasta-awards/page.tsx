import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { RastaAwardsVoting } from "@/components/awards/RastaAwardsVoting";
import { RastaAwardsSkeleton } from "@/components/awards/RastaAwardsSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchActiveSeason, fetchVotingData } from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Rasta Awards",
  "Vote nos melhores momentos e conteúdos do ano.",
  "/rasta-awards"
);

export default function RastaAwardsPage() {
  return (
    <PageTransition>
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader slug="rasta-awards" title="Rasta Awards" />
        <Suspense
          fallback={
            <SkeletonTransition>
              <RastaAwardsSkeleton />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <RastaAwardsContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function RastaAwardsContent() {
  const queryClient = getQueryClient();

  const activeSeason = await queryClient.fetchQuery({
    queryKey: queryKeys.rastaAwards.activeSeason(),
    queryFn: fetchActiveSeason,
  });

  if (activeSeason) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.rastaAwards.votingData(activeSeason.id),
      queryFn: () => fetchVotingData(activeSeason.id),
    });
  }

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RastaAwardsVoting />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
