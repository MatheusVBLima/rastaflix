import { PageHeader } from "@/components/layout/PageHeader";
import {
  PageTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import { ProfileSkeleton } from "@/components/user/ProfileSkeleton";

export default function Loading() {
  return (
    <PageTransition name="route-perfil">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <PageHeader title="Meu perfil" />
        <SkeletonTransition name="skeleton-perfil">
          <ProfileSkeleton />
        </SkeletonTransition>
      </div>
    </PageTransition>
  );
}
