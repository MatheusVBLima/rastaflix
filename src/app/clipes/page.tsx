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
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Clipes",
  "Melhores momentos das lives na Twitch e na Kick.",
  "/clipes"
);

/**
 * Render the "Clipes" page layout with a header and Suspense-wrapped content.
 *
 * The header shows the page icon, title, and description. The main content is
 * rendered inside a React.Suspense boundary that displays `ClipesSkeleton`
 * while `ClipesContent` is pending.
 *
 * @returns The page's React element containing the header and the suspended content.
 */
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

/**
 * Prefetches the clipes list into the server-side React Query cache and returns the Clipes UI wrapped for hydration and error handling.
 *
 * Prefetching ensures the client receives a hydrated cache for `queryKeys.clipes.list()` before the Clipes component mounts.
 *
 * @returns The React element that renders `Clipes` inside a `HydrationBoundary` seeded with the prefetched query cache and an `ErrorBoundary`.
 */
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
