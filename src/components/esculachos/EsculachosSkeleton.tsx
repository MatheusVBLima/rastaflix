import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

/**
 * Renders a skeleton-loading placeholder for the Esculachos list and cards layout.
 *
 * @returns A JSX element containing a header skeleton and a responsive grid of six cards, each with skeleton blocks for the top, content lines, and footer.
 */
export function EsculachosSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col h-full overflow-hidden">
            <Skeleton className="h-20 w-full" />
            <CardContent className="flex-grow p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
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
