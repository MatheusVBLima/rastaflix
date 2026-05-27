import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Render a skeleton loading layout for the Rasta Awards list.
 *
 * Renders a top placeholder bar and a responsive grid of four card placeholders
 * (single column on small screens, two columns on medium and up).
 *
 * @returns A JSX element containing the skeleton UI for the Rasta Awards view.
 */
export function RastaAwardsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
