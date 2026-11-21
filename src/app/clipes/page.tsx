import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { CardGridSkeleton } from "@/components/layout/CardGridSkeleton";
import { Clipes } from "@/components/clipes/Clipes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchClipes } from "@/lib/queries";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Clipes",
  "Melhores momentos das lives na Twitch e na Kick.",
  "/clipes"
);

export default function ClipesPage() {
  return (
    <PageTransition>
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader
          slug="clipes"
          title="Clipes"
          description="Os melhores momentos das lives na Twitch e na Kick."
        />
        <Suspense
          fallback={
            <SkeletonTransition>
              <CardGridSkeleton variant="clip" />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <ClipesContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
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
