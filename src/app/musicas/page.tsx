import { Suspense } from "react";
import { Music } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Musicas } from "@/components/musicas/Musicas";
import { MusicasSkeleton } from "@/components/musicas/MusicasSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getIsAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchMusicas } from "@/lib/queries";

/**
 * Render the Músicas page with a header and suspense-wrapped music content.
 *
 * The header shows the page title and description; the main content is provided
 * by `MusicasContent` and displayed with `MusicasSkeleton` as the suspense fallback.
 *
 * @returns The React element representing the Músicas page.
 */
export default function MusicasPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <PageHeader
        icon={Music}
        title="Músicas"
        description="Descubra e compartilhe as músicas da comunidade."
      />
      <Suspense fallback={<MusicasSkeleton />}>
        <MusicasContent />
      </Suspense>
    </div>
  );
}

/**
 * Prefetches music data and admin status, then renders the Musicas UI wrapped with hydration and error boundaries.
 *
 * @returns A React element that renders `Musicas` with `isAdmin` set, wrapped inside a `HydrationBoundary` containing the prefetched query state and an `ErrorBoundary`.
 */
async function MusicasContent() {
  const queryClient = getQueryClient();

  const [, isAdmin] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.musicas.list(),
      queryFn: fetchMusicas,
    }),
    getIsAdmin(),
  ]);

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Musicas isAdmin={isAdmin} />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
