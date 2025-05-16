import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { getInimigos } from "@/actions/inimigoActions";
import { Inimigos } from "@/components/inimigos/Inimigos";

export default async function InimigosPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  try {
    await queryClient.prefetchQuery({
      queryKey: ["inimigos"],
      queryFn: getInimigos,
    });
  } catch (error) {
    console.error(
      "Erro ao pré-buscar dados de inimigos para /inimigos (Server Component):",
      error
    );
    // Em uma aplicação real, você poderia ter uma página de erro mais robusta aqui
    // ou retornar um estado que o componente cliente possa usar para mostrar um erro.
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    // Envolve o componente cliente com HydrationBoundary e passa o estado desidratado
    <HydrationBoundary state={dehydratedState}>
      <div className="container mx-auto py-10 min-h-screen">
        <h1 className="text-2xl font-bold text-center mb-6">
          Mural de Inimigos
        </h1>
        <Inimigos />
      </div>
    </HydrationBoundary>
  );
}
