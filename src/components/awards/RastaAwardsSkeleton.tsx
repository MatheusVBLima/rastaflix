import { Skeleton } from "@/components/ui/skeleton";

export function RastaAwardsSkeleton() {
  return (
    <div className="max-w-4xl space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="space-y-3 rounded-xl border p-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-xl border p-6">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
