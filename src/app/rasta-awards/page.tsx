import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchActiveSeason, fetchVotingData } from "@/lib/queries";
import { RastaAwardsVoting } from "@/components/awards/RastaAwardsVoting";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function RastaAwardsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  let activeSeason: any = null;

  try {
    // 1. Buscar temporada ativa
    activeSeason = await queryClient.fetchQuery({
      queryKey: ["activeSeason"],
      queryFn: fetchActiveSeason,
    });

    // 2. Se houver temporada ativa, buscar dados de votação
    if (activeSeason) {
      await queryClient.prefetchQuery({
        queryKey: ["votingData", activeSeason.id],
        queryFn: () => fetchVotingData(activeSeason.id),
      });
    }
    // Nota: O userId e userVotes são gerenciados no cliente via useAuth()
    // para garantir funcionamento correto em produção
  } catch (error) {
    console.error("❌ Erro no prefetch de Rasta Awards:", error);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydratedState}>
        <div className="container mx-auto py-10 min-h-screen">
          <RastaAwardsVoting />
        </div>
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
