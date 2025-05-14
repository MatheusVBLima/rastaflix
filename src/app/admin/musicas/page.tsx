import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicListAdmin } from "@/components/admin/MusicListAdmin";
import AddMusicForm from "@/components/admin/AddMusicForm";
import { EditMusicForm } from "@/components/admin/EditMusicForm";
import { DeleteMusicForm } from "@/components/admin/DeleteMusicForm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getMusicas } from "@/actions/musicActions";

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

export default async function AdminMusicasPage() {
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

  const queryKey = ["musicas"];
  console.log(
    `🔄 Iniciando prefetch de ${queryKey[0]} no servidor para admin...`
  );
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
    console.log(
      `✅ Prefetch de ${queryKey[0]} para admin concluído em ${
        Date.now() - startTime
      }ms`
    );
  } catch (error) {
    console.error(`❌ Erro no prefetch de ${queryKey[0]} para admin:`, error);
  }

  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Músicas</h1>

      <HydrationBoundary state={dehydratedState}>
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="add">Adicionar Música</TabsTrigger>
            <TabsTrigger value="edit">Editar Música</TabsTrigger>
            <TabsTrigger value="delete">Deletar Música</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <AddMusicForm />
          </TabsContent>

          <TabsContent value="edit">
            <EditMusicForm />
          </TabsContent>

          <TabsContent value="delete">
            <DeleteMusicForm />
          </TabsContent>
        </Tabs>
      </HydrationBoundary>
    </div>
  );
}
