import { InimigosSkeleton } from "@/components/inimigos/InimigosSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition, SkeletonTransition } from "@/components/layout/PageTransition";

export default function Loading() {
  return (
    <PageTransition name="route-inimigos">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="inimigos"
          title="Mural de Inimigos"
          description="Os antagonistas dessa jornada rastafari."
        />
        <SkeletonTransition name="skeleton-inimigos">
          <InimigosSkeleton />
        </SkeletonTransition>
      </div>
    </PageTransition>
  );
}
