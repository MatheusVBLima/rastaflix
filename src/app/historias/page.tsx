import { fetchHistorias, getAllTags } from "@/lib/queries";
import { Historias } from "@/components/historias/Historias";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Story } from "@/lib/types";
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

export default async function HistoriasPage() {
  // 1. Criar QueryClient no Server Component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Dados pré-buscados ficam "frescos" eternamente (até resetQueries)
      },
    },
  });

  const queryKey = ["historias"];

  try {
    // 2. Pré-buscar os dados
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: async () => {
        const historias = await fetchHistorias();
        return historias;
      },
    });
  } catch (error) {
    console.error(`❌ Erro no prefetch de ${queryKey[0]}:`, error);
  }

  // Obter do cache já preenchido
  const historias = queryClient.getQueryData<Story[]>(queryKey) ?? [];
  const tags = await getAllTags(historias); // getAllTags pode precisar dos dados das histórias
  const isAdmin = await verificarAdmin();

  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);

  // 4. Renderizar o Client Component dentro do HydrationBoundary
  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydratedState}>
        <Historias
          initialHistorias={historias}
          initialTags={tags}
          isAdmin={isAdmin}
        />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
