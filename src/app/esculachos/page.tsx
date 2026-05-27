import { Suspense } from "react";
import { Zap } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Esculachos } from "@/components/esculachos/Esculachos";
import { EsculachosSkeleton } from "@/components/esculachos/EsculachosSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchEsculachos } from "@/lib/queries";

/**
 * Render the Esculachos page layout with a header and lazy-loaded content.
 *
 * @returns A React element containing the page header and the Esculachos content wrapped in a `Suspense` boundary with a skeleton fallback.
 */
export default function EsculachosPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <PageHeader
        icon={Zap}
        title="Esculachos"
        description="Momentos épicos da live — ouça e baixe os melhores trechos."
      />
      <Suspense fallback={<EsculachosSkeleton />}>
        <EsculachosContent />
      </Suspense>
    </div>
  );
}

/**
 * Prefetches the Esculachos list into a React Query client and renders the Esculachos component
 * hydrated with that prefetched state inside error and hydration boundaries.
 *
 * @returns The Esculachos component wrapped with an ErrorBoundary and a HydrationBoundary
 * containing the dehydrated query client state.
 */
async function EsculachosContent() {
  const queryClient = getQueryClient();

  await queryClient.fetchQuery({
    queryKey: queryKeys.esculachos.list(),
    queryFn: fetchEsculachos,
  });

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Esculachos />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
