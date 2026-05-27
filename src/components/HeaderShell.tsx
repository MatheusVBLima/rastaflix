import { getIsAdmin } from "@/lib/auth";
import { Header } from "@/components/Header";

export async function HeaderShell() {
  const isAdmin = await getIsAdmin();
  return <Header isAdmin={isAdmin} />;
}
