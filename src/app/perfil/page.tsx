import { Suspense } from "react";
import { User } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserProfile } from "@/components/user/UserProfile";
import { Metadata } from "next";
import { getIsAdmin } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Meu Perfil | Rastaflix",
  description: "Visualize suas informações e atividades na Rastaflix.",
};

/**
 * Renders the "Meu Perfil" page with a header and suspended profile content.
 *
 * The page displays a PageHeader and wraps PerfilContent in a Suspense boundary that shows two skeleton
 * placeholders while the profile data loads.
 *
 * @returns The profile page as a React element.
 */
export default function PerfilPage() {
  return (
    <div className="container mx-auto py-10 min-h-screen space-y-6">
      <PageHeader
        icon={User}
        title="Meu Perfil"
        description="Suas informações e conquistas na Rastaflix."
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        }
      >
        <PerfilContent />
      </Suspense>
    </div>
  );
}

/**
 * Fetches the current user's admin status into a React Query client and renders the user profile with hydrated query state.
 *
 * @returns A React element that wraps `UserProfile` (with its `isAdmin` prop set to the fetched admin status) in a `HydrationBoundary` populated from the query client's dehydrated state.
 */
async function PerfilContent() {
  const queryClient = getQueryClient();

  const isAdmin = await queryClient.fetchQuery({
    queryKey: queryKeys.auth.adminStatus(),
    queryFn: getIsAdmin,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile isAdmin={isAdmin} />
    </HydrationBoundary>
  );
}
