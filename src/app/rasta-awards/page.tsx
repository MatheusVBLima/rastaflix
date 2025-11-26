import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchActiveSeason, fetchVotingData, fetchUserVotes } from "@/lib/queries";
import { RastaAwardsVoting } from "@/components/awards/RastaAwardsVoting";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { auth } from "@clerk/nextjs/server";

export default async function RastaAwardsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  let activeSeason: any = null;
  let userId: string | null = null;

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

      // 3. Verificar se usuário está autenticado
      const authState = await auth();
      userId = authState.userId;

      // 4. Se autenticado, buscar votos do usuário
      if (userId) {
        await queryClient.prefetchQuery({
          queryKey: ["userVotes", userId, activeSeason.id],
          queryFn: () => fetchUserVotes(userId!, activeSeason.id),
        });
      }
    }
  } catch (error) {
    console.error("❌ Erro no prefetch de Rasta Awards:", error);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydratedState}>
        <div className="container mx-auto py-10 min-h-screen">
          <RastaAwardsVoting userId={userId} />
        </div>
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
