import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { AdminSection } from "@/components/admin/AdminSection";
import { MusicasAdmin } from "@/components/admin/managers";
import { fetchAdminMusicas } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const metadata = { title: "Admin · Músicas", robots: { index: false } };

export default async function AdminMusicasPage() {
  await requireAdmin();

  const queryClient = getQueryClient();
  try {
    await queryClient.fetchQuery({
      queryKey: queryKeys.musicas.adminList(),
      queryFn: fetchAdminMusicas,
    });
  } catch (error) {
    console.error("Erro no prefetch de musicas para admin:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSection title="Músicas">
        <MusicasAdmin />
      </AdminSection>
    </HydrationBoundary>
  );
}
