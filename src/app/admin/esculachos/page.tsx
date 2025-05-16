import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import AddEsculachoForm from "@/components/admin/AddEsculachoForm";
import { EditEsculachoForm } from "@/components/admin/EditEsculachoForm";
import { DeleteEsculachoForm } from "@/components/admin/DeleteEsculachoForm";
import { getEsculachos } from "@/actions/esculachoActions"; // Para prefetch

export default async function AdminEsculachosPage() {
  // 1. Criar QueryClient no Server Component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Dados pré-buscados ficam "frescos" eternamente
      },
    },
  });
  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    return redirect("/");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const isAdmin = user?.privateMetadata?.is_admin || false;

  if (!isAdmin) {
    return redirect("/");
  }

  // Pré-busca dos dados de esculachos para popular o cache do React Query
  const queryKey = ["esculachos"];
  const startTime = Date.now();

  try {
    // 2. Pré-buscar os dados
    await queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn: getEsculachos,
    });
  } catch (error) {
    console.error(`❌ Erro no prefetch de ${queryKey[0]} para admin:`, error);
  }

  // 3. Desidratar o cache é feito diretamente no return com <HydrationBoundary state={dehydrate(queryClient)}>

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
