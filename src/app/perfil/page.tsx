import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { UserProfile } from "@/components/user/UserProfile";
import { Metadata } from "next";
import { verificarAdmin } from "@/actions/commonActions";

export const metadata: Metadata = {
  title: "Meu Perfil | Rastaflix",
  description: "Visualize suas informações e atividades na Rastaflix.",
};

export default async function PerfilPage() {
  // 1. Criar QueryClient com staleTime: Infinity
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  const queryKey = ["userAdminStatus"];

  try {
    // 2. Prefetch admin status server-side
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: async () => {
        const isAdmin = await verificarAdmin();
        return isAdmin;
      },
    });
  } catch (error) {
    console.error("Erro no prefetch de userAdminStatus:", error);
  }

  // 3. Obter do cache
  const isAdmin = queryClient.getQueryData<boolean>(queryKey) ?? false;

  // 4. Dehydrate e passar para HydrationBoundary
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <UserProfile isAdmin={isAdmin} />
    </HydrationBoundary>
  );
}
