import { AdminSection } from "@/components/admin/AdminSection";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { fetchAdminUsers } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin · Usuários", robots: { index: false } };

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const users = await fetchAdminUsers();

  return (
    <AdminSection title="Usuários">
      <UsersTable users={users} />
    </AdminSection>
  );
}
