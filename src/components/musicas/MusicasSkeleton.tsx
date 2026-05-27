import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

/**
 * Render a skeleton-loading UI for the music list with a header bar and a responsive grid of placeholder cards.
 *
 * @returns A JSX element containing a top skeleton bar and a responsive grid of six card placeholders (image area, title line, and footer) used during loading.
 */
export function MusicasSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col h-full overflow-hidden">
            <Skeleton className="w-full pt-[56.25%]" />
            <CardContent className="p-4 flex-grow">
              <Skeleton className="h-6 w-3/4" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
