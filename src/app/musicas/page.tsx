import React from 'react';
import { getMusicas } from '@/actions/musicActions'; 
import { Musicas } from '@/components/musicas/Musicas';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { QueryClient } from '@tanstack/react-query';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

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
  
  const queryKey = ['musicas'];
  console.log(`🔄 Iniciando prefetch de ${queryKey[0]} no servidor...`);
  const startTime = Date.now();
  
  try {
    // 2. Pré-buscar os dados
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: async () => {
        const musicas = await getMusicas();
        return musicas;
      },
    });
    console.log(`✅ Prefetch de ${queryKey[0]} concluído em ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error(`❌ Erro no prefetch de ${queryKey[0]}:`, error);
  }
  
  // Buscar músicas para passar para o componente
  const musicas = await getMusicas();
  const isAdmin = await verificarAdmin();
  
  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);
  
  // 4. Renderizar o Client Component dentro do HydrationBoundary
  return (
    <HydrationBoundary state={dehydratedState}>
      <Musicas initialMusicas={musicas} isAdmin={isAdmin} />
    </HydrationBoundary>
  );
}
