import { Skeleton } from "@/components/ui/skeleton";

export function InimigosSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={i === 2 ? "col-span-2 space-y-3 rounded-xl border p-5 sm:col-span-1" : "space-y-3 rounded-xl border p-5"}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="overflow-hidden rounded-xl border">
          <Skeleton className="h-11 w-full rounded-none" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 border-t px-4 py-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
