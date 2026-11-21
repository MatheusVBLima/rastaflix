import { Skeleton } from "@/components/ui/skeleton";

export function RastaAwardsSkeleton() {
  return (
    <div className="max-w-4xl space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="space-y-3 rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex gap-3 rounded-lg border p-3">
                <Skeleton className="size-16 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3.5 w-3/5" />
                </div>
                <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
