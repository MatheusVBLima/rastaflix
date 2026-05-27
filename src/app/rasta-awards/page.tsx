import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { RastaAwardsVoting } from "@/components/awards/RastaAwardsVoting";
import { RastaAwardsSkeleton } from "@/components/awards/RastaAwardsSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchActiveSeason, fetchVotingData } from "@/lib/queries";

/**
 * Render the Rasta Awards page with a header and lazy-loaded voting content.
 *
 * @returns The page's React element containing a responsive container with a `PageHeader`
 * and `RastaAwardsContent` wrapped in `Suspense` (using `RastaAwardsSkeleton` as fallback).
 */
export default function RastaAwardsPage() {
  return (
    <div className="container mx-auto py-10 min-h-screen space-y-6">
      <PageHeader
        icon={Trophy}
        title="Rasta Awards"
        description="Vote nos melhores momentos e conteúdos do ano."
      />
      <Suspense fallback={<RastaAwardsSkeleton />}>
        <RastaAwardsContent />
      </Suspense>
    </div>
  );
}

/**
 * Prepare query data for the active awards season and render the Rasta Awards voting UI.
 *
 * Creates a React Query client, fetches the current active season, and—if present—prefetches that season's voting data so the client can hydrate immediately. Returns the voting UI wrapped in an error boundary and a hydration boundary containing the prefetched query state.
 *
 * @returns The `RastaAwardsVoting` UI wrapped with `ErrorBoundary` and `HydrationBoundary`, populated with the prefetched React Query state.
 */
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
