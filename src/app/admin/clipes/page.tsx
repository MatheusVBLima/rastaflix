import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { AdminSection } from "@/components/admin/AdminSection";
import { ClipesAdmin } from "@/components/admin/managers";
import { fetchAdminClipes } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const metadata = { title: "Admin · Clipes", robots: { index: false } };

export default async function AdminClipesPage() {
  await requireAdmin();

  const queryClient = getQueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.clipes.adminList(),
      queryFn: fetchAdminClipes,
    });
  } catch (error) {
    console.error("Erro no prefetch de clipes para admin:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSection title="Clipes">
        <ClipesAdmin />
      </AdminSection>
    </HydrationBoundary>
  );
}
