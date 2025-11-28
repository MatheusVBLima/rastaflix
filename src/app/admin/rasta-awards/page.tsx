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
import {
  Trophy,
  List,
  Users,
  BarChart,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

// Preview Button
import { PreviewButton } from "@/components/admin/awards/PreviewButton";

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
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Rasta Awards</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie temporadas, categorias, nominados e visualize resultados.
          </p>
        </div>
      </div>

      {/* Botão de Preview Flutuante */}
      <PreviewButton />

      <HydrationBoundary state={dehydratedState}>
        <Tabs defaultValue="seasons" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-4 p-1 h-auto bg-muted/50">
            <TabsTrigger value="seasons" className="py-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Temporadas
            </TabsTrigger>
            <TabsTrigger value="categories" className="py-3 flex items-center gap-2">
              <List className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="nominees" className="py-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Nominados
            </TabsTrigger>
            <TabsTrigger value="results" className="py-3 flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Resultados
            </TabsTrigger>
          </TabsList>

          {/* TAB: Seasons */}
          <TabsContent value="seasons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Temporadas</CardTitle>
                <CardDescription>
                  Crie, edite ou remova temporadas de premiação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="add-season" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="add-season" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Adicionar
                    </TabsTrigger>
                    <TabsTrigger value="edit-season" className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" /> Editar
                    </TabsTrigger>
                    <TabsTrigger value="delete-season" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Deletar
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 border rounded-lg p-6 bg-card">
                    <TabsContent value="add-season" className="mt-0">
                      <AddSeasonForm />
                    </TabsContent>

                    <TabsContent value="edit-season" className="mt-0">
                      <EditSeasonForm />
                    </TabsContent>

                    <TabsContent value="delete-season" className="mt-0">
                      <DeleteSeasonForm />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Categories */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Categorias</CardTitle>
                <CardDescription>
                  Adicione ou modifique categorias para as temporadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="add-category" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="add-category" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Adicionar
                    </TabsTrigger>
                    <TabsTrigger value="edit-category" className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" /> Editar
                    </TabsTrigger>
                    <TabsTrigger value="delete-category" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Deletar
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 border rounded-lg p-6 bg-card">
                    <TabsContent value="add-category" className="mt-0">
                      <AddCategoryForm />
                    </TabsContent>

                    <TabsContent value="edit-category" className="mt-0">
                      <EditCategoryForm />
                    </TabsContent>

                    <TabsContent value="delete-category" className="mt-0">
                      <DeleteCategoryForm />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Nominees */}
          <TabsContent value="nominees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Nominados</CardTitle>
                <CardDescription>
                  Cadastre os participantes que concorrerão aos prêmios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="add-nominee" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="add-nominee" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Adicionar
                    </TabsTrigger>
                    <TabsTrigger value="edit-nominee" className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" /> Editar
                    </TabsTrigger>
                    <TabsTrigger value="delete-nominee" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Deletar
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 border rounded-lg p-6 bg-card">
                    <TabsContent value="add-nominee" className="mt-0">
                      <AddNomineeForm />
                    </TabsContent>

                    <TabsContent value="edit-nominee" className="mt-0">
                      <EditNomineeForm />
                    </TabsContent>

                    <TabsContent value="delete-nominee" className="mt-0">
                      <DeleteNomineeForm />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Results */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Votação</CardTitle>
                <CardDescription>
                  Acompanhe em tempo real ou visualize o resultado final.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-0 border rounded-lg p-6 bg-card">
                  <ResultsViewer />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </HydrationBoundary>
    </div>
  );
}
