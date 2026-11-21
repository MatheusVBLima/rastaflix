import { notFound } from "next/navigation";
import { AdminSection } from "@/components/admin/AdminSection";
import { UserDetail } from "@/components/admin/users/UserDetail";
import { fetchAdminUserDetail } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin · Usuário", robots: { index: false } };

export default async function AdminUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await fetchAdminUserDetail(id);
  if (!user) notFound();

  return (
    <AdminSection title={user.name} parent={{ href: "/admin/usuarios", label: "Usuários" }}>
      <UserDetail user={user} />
    </AdminSection>
  );
}
