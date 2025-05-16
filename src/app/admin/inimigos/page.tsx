import React from "react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import AddInimigoForm from "@/components/admin/AddInimigoForm";
import { EditInimigoForm } from "@/components/admin/EditInimigoForm";
import { DeleteInimigoForm } from "@/components/admin/DeleteInimigoForm";
import { getInimigos } from "@/actions/inimigoActions";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminInimigosPage() {
  const authResult = await auth();
  if (!authResult.userId) {
    redirect("/");
  }

  let isUserAdmin = false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authResult.userId);
    isUserAdmin = user.privateMetadata?.is_admin === true;
  } catch (error) {
    console.error(
      "AdminInimigosPage: Erro ao buscar usuário ou metadados:",
      error
    );
    // Em um cenário de produção, você pode querer redirecionar para uma página de erro
    // ou retornar um componente de erro aqui, dependendo da gravidade.
    // Por ora, se falhar em obter o usuário, assumimos que não é admin.
    isUserAdmin = false;
  }

  if (!isUserAdmin) {
    redirect("/");
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
      },
    },
  });

  try {
    await queryClient.prefetchQuery({
      queryKey: ["inimigos"],
      queryFn: getInimigos,
    });
  } catch (error) {
    console.error(
      "Erro ao pré-buscar dados de inimigos (Server Component):",
      error
    );
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Gerenciar Inimigos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 p-6 bg-card rounded-lg shadow">
            <AddInimigoForm />
          </div>
          <div className="md:col-span-2 p-6 bg-card rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-6">
              Editar/Excluir Inimigos
            </h2>
            <EditInimigoForm />
            <div className="mt-8">
              <DeleteInimigoForm />
            </div>
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
