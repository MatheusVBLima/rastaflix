import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { IlhaDoAvoGame } from "@/components/games/ilha-do-avo/IlhaDoAvoGame";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition, RevealTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { fetchGameLeaderboard } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import { GAME_SLUG } from "@/lib/games/ilha-do-avo/types";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Ilha do Avô Romeno — Ovelhera Survivors",
  "Sobreviva às hordas na Ilha do Avô Romeno e dispute o ranking global.",
  "/jogos/ilha-do-avo-romeno"
);

export default async function IlhaDoAvoRomenoPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity },
    },
  });

  await queryClient.prefetchQuery({
    queryKey: queryKeys.games.leaderboard(GAME_SLUG),
    queryFn: () => fetchGameLeaderboard(GAME_SLUG, 15),
  });

  return (
    <PageTransition name="route-ilha-do-avo">
      <div className="container mx-auto space-y-6 px-4 py-8 md:px-6">
        <PageHeader
          title="Ovelhera Survivors"
          description="5 fases em mapas grandes — da Ilha do Avô Romeno até a batalha final contra a Morango em São Luís."
          aside={
            <Button variant="outline" size="sm" asChild>
              <Link href="/jogos">
                <ArrowLeft className="mr-1.5 size-4" aria-hidden />
                Todos os jogos
              </Link>
            </Button>
          }
        />

        <RevealTransition>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <IlhaDoAvoGame />
          </HydrationBoundary>
        </RevealTransition>
      </div>
    </PageTransition>
  );
}
