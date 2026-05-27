import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import AddEsculachoForm from "@/components/admin/AddEsculachoForm";
import { EditEsculachoForm } from "@/components/admin/EditEsculachoForm";
import { DeleteEsculachoForm } from "@/components/admin/DeleteEsculachoForm";
import { fetchEsculachos } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminEsculachosPage() {
  await requireAdmin();

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.esculachos.list(),
      queryFn: fetchEsculachos,
    });
  } catch (error) {
    console.error("Erro no prefetch de esculachos para admin:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto py-10 min-h-screen">
        <h1 className="text-3xl font-bold mb-8">Gerenciamento de Esculachos</h1>

        <Tabs defaultValue="adicionar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="adicionar">Adicionar Esculacho</TabsTrigger>
            <TabsTrigger value="editar">Editar Esculacho</TabsTrigger>
            <TabsTrigger value="deletar">Deletar Esculacho</TabsTrigger>
          </TabsList>

          <TabsContent value="adicionar">
            <AddEsculachoForm />
          </TabsContent>

          <TabsContent value="editar">
            <EditEsculachoForm />
          </TabsContent>

          <TabsContent value="deletar">
            <DeleteEsculachoForm />
          </TabsContent>
        </Tabs>
      </div>
    </HydrationBoundary>
  );
}
