import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QueryClient } from "@tanstack/react-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import {
  fetchAllSeasons,
  fetchCategoriesBySeason,
  fetchNomineesByCategory,
} from "@/lib/queries";

// Forms - Seasons
import { AddSeasonForm } from "@/components/admin/awards/AddSeasonForm";
import { EditSeasonForm } from "@/components/admin/awards/EditSeasonForm";
import { DeleteSeasonForm } from "@/components/admin/awards/DeleteSeasonForm";

// Forms - Categories
import { AddCategoryForm } from "@/components/admin/awards/AddCategoryForm";
import { EditCategoryForm } from "@/components/admin/awards/EditCategoryForm";
import { DeleteCategoryForm } from "@/components/admin/awards/DeleteCategoryForm";

// Forms - Nominees
import { AddNomineeForm } from "@/components/admin/awards/AddNomineeForm";
import { EditNomineeForm } from "@/components/admin/awards/EditNomineeForm";
import { DeleteNomineeForm } from "@/components/admin/awards/DeleteNomineeForm";

// Results Viewer
import { ResultsViewer } from "@/components/admin/awards/ResultsViewer";

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

export default async function AdminRastaAwardsPage() {
  // Verificação de autenticação e permissão de admin
  const isAdmin = await verificarAdminServerPage();
  if (!isAdmin) {
    redirect("/");
  }

  // 1. Criar QueryClient no Server Component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  try {
    // 2. Pré-buscar dados essenciais
    await queryClient.prefetchQuery({
      queryKey: ["seasons"],
      queryFn: fetchAllSeasons,
    });
  } catch (error) {
    console.error("❌ Erro no prefetch de seasons para admin:", error);
  }

  // 3. Desidratar o cache
  const dehydratedState = dehydrate(queryClient);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        Gerenciamento de Rasta Awards
      </h1>

      <HydrationBoundary state={dehydratedState}>
        <Tabs defaultValue="seasons" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="seasons">Temporadas</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="nominees">Nominados</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          {/* TAB: Seasons */}
          <TabsContent value="seasons">
            <Tabs defaultValue="add-season" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="add-season">Adicionar</TabsTrigger>
                <TabsTrigger value="edit-season">Editar</TabsTrigger>
                <TabsTrigger value="delete-season">Deletar</TabsTrigger>
              </TabsList>

              <TabsContent value="add-season">
                <AddSeasonForm />
              </TabsContent>

              <TabsContent value="edit-season">
                <EditSeasonForm />
              </TabsContent>

              <TabsContent value="delete-season">
                <DeleteSeasonForm />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB: Categories */}
          <TabsContent value="categories">
            <Tabs defaultValue="add-category" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="add-category">Adicionar</TabsTrigger>
                <TabsTrigger value="edit-category">Editar</TabsTrigger>
                <TabsTrigger value="delete-category">Deletar</TabsTrigger>
              </TabsList>

              <TabsContent value="add-category">
                <AddCategoryForm />
              </TabsContent>

              <TabsContent value="edit-category">
                <EditCategoryForm />
              </TabsContent>

              <TabsContent value="delete-category">
                <DeleteCategoryForm />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB: Nominees */}
          <TabsContent value="nominees">
            <Tabs defaultValue="add-nominee" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="add-nominee">Adicionar</TabsTrigger>
                <TabsTrigger value="edit-nominee">Editar</TabsTrigger>
                <TabsTrigger value="delete-nominee">Deletar</TabsTrigger>
              </TabsList>

              <TabsContent value="add-nominee">
                <AddNomineeForm />
              </TabsContent>

              <TabsContent value="edit-nominee">
                <EditNomineeForm />
              </TabsContent>

              <TabsContent value="delete-nominee">
                <DeleteNomineeForm />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB: Results */}
          <TabsContent value="results">
            <ResultsViewer />
          </TabsContent>
        </Tabs>
      </HydrationBoundary>
    </div>
  );
}
