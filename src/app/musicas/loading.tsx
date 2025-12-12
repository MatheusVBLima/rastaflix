import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-start">
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
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
