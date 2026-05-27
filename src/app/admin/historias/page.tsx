import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryListAdmin } from "@/components/admin/StoryListAdmin";
import { AddStoryForm } from "@/components/admin/AddStoryForm";
import { EditStoryForm } from "@/components/admin/EditStoryForm";
import { DeleteStoryForm } from "@/components/admin/DeleteStoryForm";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchHistorias } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Render the admin "Gerenciamento de Histórias" page with tabbed interfaces for adding, editing, and deleting stories.
 *
 * Ensures the current user has admin access before proceeding and attempts to prefetch the stories list for client-side hydration.
 *
 * @returns The React element for the admin "Gerenciamento de Histórias" page (tabbed UI with Add, Edit, and Delete story sections).
 */
export default async function AdminHistoriasPage() {
  await requireAdmin();

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.historias.list(),
      queryFn: fetchHistorias,
    });
  } catch (error) {
    console.error("Erro no prefetch de historias para admin:", error);
  }

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
