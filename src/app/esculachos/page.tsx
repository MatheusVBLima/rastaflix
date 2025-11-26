import React from "react";
import { fetchEsculachos } from "@/lib/queries";
import { Esculacho } from "@/lib/types"; // Precisaremos do tipo Esculacho
import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Esculachos } from "@/components/esculachos/Esculachos"; // Importar o novo componente

// Não vamos verificar admin por enquanto para a página pública
// async function verificarAdmin(): Promise<boolean> { ... }

export default async function EsculachosPage() {
  // 1. Criar QueryClient no Server Component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  const queryKey = ["esculachos"];
  const startTime = Date.now();

  try {
    // 2. Pré-buscar os dados
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: async () => {
        const esculachosData = await fetchEsculachos();
        return esculachosData; // fetchEsculachos retorna diretamente o array Esculacho[]
      },
    });
  } catch (error) {
    console.error(
      `❌ Erro no prefetch de ${queryKey[0]} para página pública:`,
      error
    );
  }

  // Obter do cache já preenchido, como sugerido
  const esculachos = queryClient.getQueryData<Esculacho[]>(queryKey) ?? [];

  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Esculachos initialEsculachos={esculachos} />
    </HydrationBoundary>
  );
}
