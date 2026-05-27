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
