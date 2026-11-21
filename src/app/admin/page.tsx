import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { fetchAdminDashboard } from "@/lib/admin-data";
import { PageTransition, RevealTransition } from "@/components/layout/PageTransition";
import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = { title: "Painel", robots: { index: false } };

export default async function AdminPage() {
  await requireAdmin();
  const data = await fetchAdminDashboard();

  return (
    <PageTransition name="route-admin">
      <div className="container mx-auto space-y-8 px-4 py-10 md:px-6">
        <header className="space-y-3 border-b pb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" transitionTypes={["nav-back"]}>
                    Início
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Painel</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Painel
          </h1>
        </header>
        <RevealTransition>
          <AdminDashboard data={data} />
        </RevealTransition>
      </div>
    </PageTransition>
  );
}
