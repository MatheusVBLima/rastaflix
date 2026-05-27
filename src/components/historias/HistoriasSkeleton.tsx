import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Renders a responsive skeleton placeholder layout for the Historias section.
 *
 * The markup includes a header-like row of two skeleton bars and a grid of six card-shaped skeletons,
 * each with an image/media placeholder and multiple content lines, adapting to 1/2/3 columns at
 * different breakpoints.
 *
 * @returns A React element containing the header skeletons and six card skeleton placeholders arranged responsively.
 */
export function HistoriasSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-full md:w-[200px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="w-full pt-[56.25%]" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
