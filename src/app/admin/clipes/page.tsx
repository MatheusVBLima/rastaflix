import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddClipeForm from "@/components/admin/AddClipeForm";
import { EditClipeForm } from "@/components/admin/EditClipeForm";
import { DeleteClipeForm } from "@/components/admin/DeleteClipeForm";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchClipes } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminClipesPage() {
  await requireAdmin();

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.clipes.list(),
      queryFn: fetchClipes,
    });
  } catch (error) {
    console.error("Erro no prefetch de clipes para admin:", error);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Clipes</h1>

      <HydrationBoundary state={dehydratedState}>
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="add">Adicionar Clipe</TabsTrigger>
            <TabsTrigger value="edit">Editar Clipe</TabsTrigger>
            <TabsTrigger value="delete">Deletar Clipe</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <AddClipeForm />
          </TabsContent>

          <TabsContent value="edit">
            <EditClipeForm />
          </TabsContent>

          <TabsContent value="delete">
            <DeleteClipeForm />
          </TabsContent>
        </Tabs>
      </HydrationBoundary>
    </div>
  );
}
