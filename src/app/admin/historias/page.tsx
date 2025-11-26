import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryListAdmin } from "@/components/admin/StoryListAdmin";
import { AddStoryForm } from "@/components/admin/AddStoryForm";
import { EditStoryForm } from "@/components/admin/EditStoryForm";
import { DeleteStoryForm } from "@/components/admin/DeleteStoryForm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchHistorias } from "@/lib/queries";

async function verificarAdminServerPage(): Promise<boolean> {
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

export default async function AdminHistoriasPage() {
  // Verificação de autenticação e permissão de admin
  const isAdmin = await verificarAdminServerPage();
  if (!isAdmin) {
    redirect("/"); // Ou para uma página de "acesso negado"
  }

  // 1. Criar QueryClient no Server Component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Dados pré-buscados ficam "frescos" eternamente (até resetQueries)
      },
    },
  });

  const queryKey = ["historias"];
  const startTime = Date.now();

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
    console.error(`❌ Erro no prefetch de ${queryKey[0]} para admin:`, error);
  }

  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Histórias</h1>

      <HydrationBoundary state={dehydratedState}>
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="add">Adicionar História</TabsTrigger>
            <TabsTrigger value="edit">Editar História</TabsTrigger>
            <TabsTrigger value="delete">Deletar História</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <AddStoryForm />
          </TabsContent>

          <TabsContent value="edit">
            <EditStoryForm />
          </TabsContent>
          <TabsContent value="delete">
            <DeleteStoryForm />
          </TabsContent>
        </Tabs>
      </HydrationBoundary>
    </div>
  );
}
