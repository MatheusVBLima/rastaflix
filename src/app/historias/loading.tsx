import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-start">
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
