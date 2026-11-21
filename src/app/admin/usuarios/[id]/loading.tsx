import { AdminSection } from "@/components/admin/AdminSection";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AdminSection title="Usuário" isLoading parent={{ href: "/admin/usuarios", label: "Usuários" }}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-busy="true">
        {["lg:col-span-4 h-40", "lg:col-span-8 h-40", "lg:col-span-8 h-80", "lg:col-span-4 h-80", "lg:col-span-5 h-72", "lg:col-span-7 h-72"].map((c, i) => (
          <Skeleton key={i} className={`rounded-xl ${c}`} />
        ))}
      </div>
    </AdminSection>
  );
}
