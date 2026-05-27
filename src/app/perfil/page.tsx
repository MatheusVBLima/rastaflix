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
