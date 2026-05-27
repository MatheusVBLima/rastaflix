import { Suspense } from "react";
import { Users } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Inimigos } from "@/components/inimigos/Inimigos";
import { InimigosSkeleton } from "@/components/inimigos/InimigosSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchInimigos } from "@/lib/queries";

/**
 * Page component that displays the "Mural de Inimigos" header and its prefetched content with a Suspense fallback.
 *
 * @returns A React element for the Inimigos page containing a PageHeader and Suspense-wrapped InimigosContent with an InimigosSkeleton fallback.
 */
export default function InimigosPage() {
  return (
    <div className="container mx-auto py-10 min-h-screen space-y-6">
      <PageHeader
        icon={Users}
        title="Mural de Inimigos"
        description="Conheça os antagonistas dessa jornada rastafari."
      />
      <Suspense fallback={<InimigosSkeleton />}>
        <InimigosContent />
      </Suspense>
    </div>
  );
}

/**
 * Prefetches the `inimigos` query into a query client and returns the hydrated UI for the Inimigos component.
 *
 * @returns A React element tree rendering `Inimigos` wrapped with an `ErrorBoundary` and a `HydrationBoundary` initialized with the prefetched query cache.
 */
async function InimigosContent() {
  const queryClient = getQueryClient();

  await queryClient.fetchQuery({
    queryKey: queryKeys.inimigos.list(),
    queryFn: fetchInimigos,
  });

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Inimigos />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
