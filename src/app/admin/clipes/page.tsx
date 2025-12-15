import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddClipeForm from "@/components/admin/AddClipeForm";
import { EditClipeForm } from "@/components/admin/EditClipeForm";
import { DeleteClipeForm } from "@/components/admin/DeleteClipeForm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchClipes } from "@/lib/queries";

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

export default async function AdminClipesPage() {
  const isAdmin = await verificarAdminServerPage();
  if (!isAdmin) {
    redirect("/");
  }

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
    console.error(`Erro no prefetch de ${queryKey[0]} para admin:`, error);
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
