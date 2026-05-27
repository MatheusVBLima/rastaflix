import React, { Suspense } from "react";
import { fetchMusicas } from "@/lib/queries";
import { Musicas } from "@/components/musicas/Musicas";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music } from "@/lib/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";

async function verificarAdmin(): Promise<boolean> {
  const authState = await auth();
  if (!authState.userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return user.privateMetadata?.is_admin === true;
  } catch {
    return false;
  }
}

export default async function MusicasPage() {
  // 1. Criar QueryClient no Server Component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Dados pré-buscados ficam "frescos" eternamente (até resetQueries)
      },
    },
  });

  const queryKey = ["musicas"];
  const startTime = Date.now();

  try {
    // 2. Pré-buscar os dados
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: async () => {
        const musicas = await fetchMusicas();
        return musicas;
      },
    });
  } catch (error) {
    console.error(`❌ Erro no prefetch de ${queryKey[0]}:`, error);
  }

  // Obter do cache já preenchido
  const musicas = queryClient.getQueryData<Music[]>(queryKey) ?? [];
  const isAdmin = await verificarAdmin();

  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);

  // 4. Renderizar o Client Component dentro do HydrationBoundary
  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydratedState}>
        <Musicas initialMusicas={musicas} isAdmin={isAdmin} />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
