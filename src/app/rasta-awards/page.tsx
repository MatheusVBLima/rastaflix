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
import { auth } from "@clerk/nextjs/server";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchActiveSeason,
  fetchAllCategoriesWithResults,
  fetchUserVotes,
  fetchVotingData,
} from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Rasta Awards",
  "Vote nos melhores momentos e conteúdos do ano.",
  "/rasta-awards"
);

export default function RastaAwardsPage() {
  return (
    <PageTransition name="route-rasta-awards">
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10 md:px-6">
        <PageHeader slug="rasta-awards" title="Rasta Awards" />
        <Suspense
          fallback={
            <SkeletonTransition name="skeleton-rasta-awards">
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
  const [{ userId }, activeSeason] = await Promise.all([
    auth().catch(() => ({ userId: null })),
    queryClient.fetchQuery({
      queryKey: queryKeys.rastaAwards.activeSeason(),
      queryFn: fetchActiveSeason,
    }),
  ]);

  if (activeSeason) {
    const prefetches: Promise<unknown>[] = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.rastaAwards.votingData(activeSeason.id),
        queryFn: () => fetchVotingData(activeSeason.id),
      }),
    ];

    if (userId) {
      prefetches.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.rastaAwards.userVotes(userId, activeSeason.id),
          queryFn: () => fetchUserVotes(userId, activeSeason.id),
        })
      );
    }

    if (activeSeason.status === "closed") {
      prefetches.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.rastaAwards.results(activeSeason.id),
          queryFn: () => fetchAllCategoriesWithResults(activeSeason.id),
        })
      );
    }

    await Promise.all(prefetches);
  }

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RastaAwardsVoting initialUserId={userId ?? null} />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
