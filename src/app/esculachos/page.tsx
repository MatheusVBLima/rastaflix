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
