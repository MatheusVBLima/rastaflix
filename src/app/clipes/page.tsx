import { fetchClipes } from "@/lib/queries";
import { Clipes } from "@/components/clipes/Clipes";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Clipe } from "@/lib/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function ClipesPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  const queryKey = ["clipes"];

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: async () => {
        const clipes = await fetchClipes();
        return clipes;
      },
    });
  } catch (error) {
    console.error(`Erro no prefetch de ${queryKey[0]}:`, error);
  }

  const clipes = queryClient.getQueryData<Clipe[]>(queryKey) ?? [];
  const dehydratedState = dehydrate(queryClient);

  return (
    <ErrorBoundary>
      <HydrationBoundary state={dehydratedState}>
        <Clipes initialClipes={clipes} />
      </HydrationBoundary>
    </ErrorBoundary>
  );
}
