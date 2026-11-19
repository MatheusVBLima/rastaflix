import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { AdminSection } from "@/components/admin/AdminSection";
import { EsculachosAdmin } from "@/components/admin/managers";
import { fetchEsculachos } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const metadata = { title: "Admin · Esculachos", robots: { index: false } };

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
      <AdminSection title="Esculachos">
        <EsculachosAdmin />
      </AdminSection>
    </HydrationBoundary>
  );
}
