import { Suspense } from "react";
import { Film } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Clipes } from "@/components/clipes/Clipes";
import { ClipesSkeleton } from "@/components/clipes/ClipesSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchClipes } from "@/lib/queries";

export default function ClipesPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <PageHeader
        icon={Film}
        title="Clipes"
        description="Melhores momentos das lives na Twitch e na Kick."
      />
      <Suspense fallback={<ClipesSkeleton />}>
        <ClipesContent />
      </Suspense>
    </div>
  );
}

async function ClipesContent() {
  const queryClient = getQueryClient();

  await queryClient.fetchQuery({
    queryKey: queryKeys.clipes.list(),
    queryFn: fetchClipes,
  });

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Clipes />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
