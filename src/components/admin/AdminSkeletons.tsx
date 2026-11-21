import Link from "next/link";
import { AdminSection } from "@/components/admin/AdminSection";
import { PageTransition, SkeletonTransition } from "@/components/layout/PageTransition";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

function AdminTableBlockSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando tabela">
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

/** Skeleton fiel ao dashboard /admin (cabeçalho real + grade de 6 módulos). */
export function AdminDashboardSkeleton() {
  return (
    <PageTransition name="route-admin">
      <div
        className="container mx-auto space-y-8 px-4 py-10 md:px-6"
        aria-busy="true"
        aria-label="Carregando painel"
      >
        <header className="space-y-3 border-b pb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" transitionTypes={["nav-back"]}>
                    Início
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Painel</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Painel
          </h1>
        </header>
        <SkeletonTransition name="skeleton-admin">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-xl border bg-card p-5 lg:col-span-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
            ))}
            {[
              "sm:col-span-2 lg:col-span-8 h-80",
              "lg:col-span-4 h-80",
              "sm:col-span-2 lg:col-span-8 h-72",
              "sm:col-span-2 lg:col-span-4 h-72",
              "sm:col-span-2 lg:col-span-7 h-80",
              "sm:col-span-2 lg:col-span-5 h-80",
            ].map((cls, i) => (
              <div key={i} className={`flex flex-col gap-4 rounded-xl border bg-card p-5 ${cls}`}>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48 max-w-full" />
                </div>
                <Skeleton className="flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        </SkeletonTransition>
      </div>
    </PageTransition>
  );
}

/** Skeleton fiel às páginas de tabela do admin (/admin/historias, musicas, etc.). */
export function AdminTablePageSkeleton({ title }: { title: string }) {
  return (
    <AdminSection title={title} isLoading>
      <AdminTableBlockSkeleton rows={8} />
    </AdminSection>
  );
}

/** Skeleton fiel à gestão do Rasta Awards (/admin/rasta-awards: abas + tabela). */
export function AdminAwardsPageSkeleton() {
  return (
    <AdminSection title="Rasta Awards" isLoading>
      <div className="space-y-6">
        <div className="inline-flex h-10 w-full items-center gap-1 rounded-lg bg-muted p-1 sm:w-fit">
          <Skeleton className="h-8 w-28 rounded-md bg-background/80" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <AdminTableBlockSkeleton rows={6} />
      </div>
    </AdminSection>
  );
}
