import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { AdminSection } from "@/components/admin/AdminSection";
import { InimigosAdmin } from "@/components/admin/managers";
import { fetchInimigos } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const metadata = { title: "Admin · Inimigos", robots: { index: false } };

export default async function AdminInimigosPage() {
  await requireAdmin();

  const queryClient = getQueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.inimigos.list(),
      queryFn: fetchInimigos,
    });
  } catch (error) {
    console.error("Erro no prefetch de inimigos para admin:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSection title="Inimigos">
        <InimigosAdmin />
      </AdminSection>
    </HydrationBoundary>
  );
}
