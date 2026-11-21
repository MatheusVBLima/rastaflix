import { Skeleton } from "@/components/ui/skeleton";

export function InimigosSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        <div className="space-y-2 rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-14" />
        </div>
        <div className="space-y-2 rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-14" />
        </div>
        <div className="col-span-2 flex flex-col justify-end gap-3 rounded-xl border bg-card p-5 sm:col-span-1">
          <Skeleton className="h-4 w-44 max-w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="ml-auto h-9 w-24 rounded-md" />
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-6 bg-muted/40 px-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-28" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 border-t px-4 py-3.5">
              <Skeleton className={i % 2 === 0 ? "h-4 w-44" : "h-4 w-32"} />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
