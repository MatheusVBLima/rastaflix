import React from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import AddInimigoForm from "@/components/admin/AddInimigoForm";
import { EditInimigoForm } from "@/components/admin/EditInimigoForm";
import { DeleteInimigoForm } from "@/components/admin/DeleteInimigoForm";
import { fetchInimigos } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Admin page for managing "inimigos" that enforces admin access, prefetches the inimigos query cache for client hydration, and renders add/edit/delete forms.
 *
 * This server component ensures the current user has admin privileges, attempts to prefetch the inimigos list into a React Query client (swallowing fetch errors), and returns a hydrated React UI that contains forms to add, edit, and delete inimigos.
 *
 * @returns A React element rendering the admin interface for managing `inimigos`, with the query cache dehydrated for client-side reuse.
 */
export default async function AdminInimigosPage() {
  await requireAdmin();

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.inimigos.list(),
      queryFn: fetchInimigos,
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
