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
