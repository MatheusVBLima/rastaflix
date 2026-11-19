import { RastaAwardsSkeleton } from "@/components/awards/RastaAwardsSkeleton";
import { SkeletonTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SkeletonTransition>
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <div className="space-y-3 border-b pb-6">
          <Skeleton className="h-14 w-72 max-w-full" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
        <RastaAwardsSkeleton />
      </div>
    </SkeletonTransition>
  );
}
