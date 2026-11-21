import { RastaAwardsSkeleton } from "@/components/awards/RastaAwardsSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition, SkeletonTransition } from "@/components/layout/PageTransition";

export default function Loading() {
  return (
    <PageTransition name="route-rasta-awards">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader slug="rasta-awards" title="Rasta Awards" />
        <SkeletonTransition name="skeleton-rasta-awards">
          <RastaAwardsSkeleton />
        </SkeletonTransition>
      </div>
    </PageTransition>
  );
}
