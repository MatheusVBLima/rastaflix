import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchAllSeasons } from "@/lib/queries";
import { AdminSection } from "@/components/admin/AdminSection";
import { AwardsAdmin } from "@/components/admin/awards/AwardsAdmin";
import { PreviewButton } from "@/components/admin/awards/PreviewButton";

export const metadata = { title: "Admin · Rasta Awards", robots: { index: false } };

export default async function AdminRastaAwardsPage() {
  await requireAdmin();

  const queryClient = getQueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.rastaAwards.seasons(),
      queryFn: fetchAllSeasons,
    });
  } catch (error) {
    console.error("Erro no prefetch de seasons para admin:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSection title="Rasta Awards">
        <AwardsAdmin />
      </AdminSection>
      <PreviewButton />
    </HydrationBoundary>
  );
}
