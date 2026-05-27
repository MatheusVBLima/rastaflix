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
