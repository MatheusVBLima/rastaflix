import { SkeletonTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { GameLeaderboardSkeleton } from "@/components/games/ilha-do-avo/GameLeaderboard";

export default function Loading() {
  return (
    <SkeletonTransition>
      <div
        className="container mx-auto space-y-6 px-4 py-8 md:px-6"
        aria-busy="true"
        aria-label="Carregando jogo"
      >
        <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-9 w-72 max-w-full sm:h-12 md:h-14" />
            <Skeleton className="h-5 w-[34rem] max-w-full" />
          </div>
          <Skeleton className="h-9 w-36 shrink-0 rounded-md" />
        </div>

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
      </div>
    </SkeletonTransition>
  );
}
