import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { UserProfile } from "@/components/user/UserProfile";
import { ProfileSkeleton } from "@/components/user/ProfileSkeleton";
import { Metadata } from "next";
import { getHeaderAuth } from "@/lib/auth";
import { fetchUserAchievements } from "@/lib/queries";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const metadata: Metadata = {
  title: "Meu perfil",
  description: "Visualize suas informações e atividades na Rastaflix.",
};

/**
 * Renders the "Meu Perfil" page with a header and suspended profile content.
 */
export default function PerfilPage() {
  return (
    <PageTransition name="route-perfil">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader title="Meu perfil" />
        <Suspense
          fallback={
            <SkeletonTransition name="skeleton-perfil">
              <ProfileSkeleton />
            </SkeletonTransition>
          }
        >
          <RevealTransition>
            <PerfilContent />
          </RevealTransition>
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function PerfilContent() {
  const queryClient = getQueryClient();
  const { isAdmin, user } = await getHeaderAuth();

  if (user?.id) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user.achievements(user.id),
      queryFn: () => fetchUserAchievements(user.id),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile isAdmin={isAdmin} initialUser={user} />
    </HydrationBoundary>
  );
}
