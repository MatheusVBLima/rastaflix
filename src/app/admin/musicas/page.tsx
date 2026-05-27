import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MusicListAdmin } from "@/components/admin/MusicListAdmin";
import AddMusicForm from "@/components/admin/AddMusicForm";
import { EditMusicForm } from "@/components/admin/EditMusicForm";
import { DeleteMusicForm } from "@/components/admin/DeleteMusicForm";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchMusicas } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Render the admin music management page with tabs to add, edit, and delete music.
 *
 * Ensures the current user has admin access, prefetches the music list into the React Query client for client-side hydration (errors during prefetch are logged), and returns the page's React element wrapped with the dehydrated query state.
 *
 * @returns The React element for the admin music management UI with dehydrated React Query state for hydration.
 */
export default async function AdminMusicasPage() {
  await requireAdmin();

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.musicas.list(),
      queryFn: fetchMusicas,
    });
  } catch (error) {
    console.error("Erro no prefetch de musicas para admin:", error);
  }

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
