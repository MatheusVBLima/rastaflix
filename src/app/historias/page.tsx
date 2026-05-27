import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Historias } from "@/components/historias/Historias";
import { HistoriasSkeleton } from "@/components/historias/HistoriasSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getIsAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchHistorias, getAllTags } from "@/lib/queries";

/**
 * Render the "Histórias" page layout with a header and a Suspense boundary for content.
 *
 * The layout includes a PageHeader configured for the "Histórias" section and a Suspense
 * boundary that displays a HistoriasSkeleton fallback while HistoriasContent loads.
 *
 * @returns The page's JSX element containing the container, header, and suspense-wrapped content.
 */
export default function HistoriasPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Histórias"
        description="Histórias que o dog tenta esconder — explore, filtre e compartilhe."
      />
      <Suspense fallback={<HistoriasSkeleton />}>
        <HistoriasContent />
      </Suspense>
    </div>
  );
}

/**
 * Prefetches data required by the Histórias UI and returns the hydrated component tree.
 *
 * Fetches the list of historias and the current admin flag, derives tags, and renders
 * the `Historias` component wrapped in an `ErrorBoundary` and a `HydrationBoundary`
 * seeded with the preloaded React Query state.
 *
 * @returns A React element tree that renders the `Historias` UI wrapped in an `ErrorBoundary`
 *          and a `HydrationBoundary` containing the preloaded React Query state.
 */
async function HistoriasContent() {
  const queryClient = getQueryClient();

  const [historias, isAdmin] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.historias.list(),
      queryFn: fetchHistorias,
    }),
    getIsAdmin(),
  ]);

  const tags = await getAllTags(historias);

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Historias tags={tags} isAdmin={isAdmin} />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
