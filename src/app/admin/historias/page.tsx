import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { AdminSection } from "@/components/admin/AdminSection";
import { HistoriasAdmin } from "@/components/admin/managers";
import { fetchAdminHistorias } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const metadata = { title: "Admin · Histórias", robots: { index: false } };

export default async function AdminHistoriasPage() {
  await requireAdmin();

  const queryClient = getQueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.historias.adminList(),
      queryFn: fetchAdminHistorias,
    });
  } catch (error) {
    console.error("Erro no prefetch de historias para admin:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSection title="Histórias">
        <HistoriasAdmin />
      </AdminSection>
    </HydrationBoundary>
  );
}
