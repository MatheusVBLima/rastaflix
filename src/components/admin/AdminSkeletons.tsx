import { SkeletonTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";

function AdminHeaderSkeleton({ levels }: { levels: 2 | 3 }) {
  return (
    <div className="space-y-3 border-b pb-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-4 w-14" />
        {levels === 3 && (
          <>
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </>
        )}
      </div>
      <Skeleton className="h-9 w-48 max-w-full sm:h-10" />
    </div>
  );
}

function AdminTableBlockSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-6 bg-muted/40 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-t px-4 py-3.5">
            <Skeleton className={i % 2 === 0 ? "h-4 w-48 max-w-[55%]" : "h-4 w-36 max-w-[45%]"} />
            <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="ml-auto h-8 w-16 rounded-md" />
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
  );
}

/** Skeleton fiel ao dashboard /admin (header + grade de 6 módulos). */
export function AdminDashboardSkeleton() {
  return (
    <SkeletonTransition>
      <div
        className="container mx-auto space-y-8 px-4 py-10 md:px-6"
        aria-busy="true"
        aria-label="Carregando painel"
      >
        <AdminHeaderSkeleton levels={2} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border bg-card p-5"
            >
              <Skeleton className="size-6 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-36 max-w-full" />
              </div>
              <Skeleton className="size-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonTransition>
  );
}

/** Skeleton fiel às páginas de tabela do admin (/admin/historias, musicas, etc.). */
export function AdminTablePageSkeleton() {
  return (
    <SkeletonTransition>
      <div
        className="container mx-auto space-y-8 px-4 py-10 md:px-6"
        aria-busy="true"
        aria-label="Carregando gestão"
      >
        <AdminHeaderSkeleton levels={3} />
        <AdminTableBlockSkeleton rows={8} />
      </div>
    </SkeletonTransition>
  );
}

/** Skeleton fiel à gestão do Rasta Awards (/admin/rasta-awards: abas + tabela). */
export function AdminAwardsPageSkeleton() {
  return (
    <SkeletonTransition>
      <div
        className="container mx-auto space-y-8 px-4 py-10 md:px-6"
        aria-busy="true"
        aria-label="Carregando gestão do Rasta Awards"
      >
        <AdminHeaderSkeleton levels={3} />
        <div className="space-y-6">
          <div className="inline-flex h-10 w-full items-center gap-1 rounded-lg bg-muted p-1 sm:w-fit">
            <Skeleton className="h-8 w-28 rounded-md bg-background/80" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <AdminTableBlockSkeleton rows={6} />
        </div>
      </div>
    </SkeletonTransition>
  );
}
