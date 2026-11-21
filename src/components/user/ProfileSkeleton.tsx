import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton fiel à página de perfil (identidade, dados da conta e conquistas). */
export function ProfileSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Carregando">
      {/* Identidade */}
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0 rounded-md" />
      </div>

      {/* Conta */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>

      {/* Conquistas */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
