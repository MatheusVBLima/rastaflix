import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition, SkeletonTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GameLeaderboardSkeleton } from "@/components/games/ilha-do-avo/GameLeaderboard";

export default function Loading() {
  return (
    <PageTransition name="route-ilha-do-avo">
      <div
        className="container mx-auto space-y-6 px-4 py-8 md:px-6"
        aria-busy="true"
        aria-label="Carregando jogo"
      >
        <PageHeader
          title="Ovelhera Survivors"
          description="5 fases, da Ilha do Avô Romeno até a batalha final contra a Morango em São Luís."
          aside={
            <Button variant="outline" size="sm" asChild>
              <Link href="/jogos">
                <ArrowLeft className="mr-1.5 size-4" aria-hidden />
                Todos os jogos
              </Link>
            </Button>
          }
        />

        <SkeletonTransition name="skeleton-ilha-do-avo">
          <div className="space-y-10">
            <Skeleton className="h-[76vh] min-h-[540px] max-h-[840px] w-full rounded-2xl" />

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-5 rounded-md" />
                  <Skeleton className="h-7 w-64" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="overflow-hidden rounded-xl border bg-card">
                <GameLeaderboardSkeleton rows={6} />
              </div>
            </section>
          </div>
        </SkeletonTransition>
      </div>
    </PageTransition>
  );
}
