import Link from "next/link";
import type { ReactNode } from "react";
import {
  PageTransition,
  RevealTransition,
  SkeletonTransition,
} from "@/components/layout/PageTransition";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function toRouteSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Layout comum das páginas de gestão: breadcrumb completo, título e conteúdo. */
export function AdminSection({
  title,
  isLoading = false,
  parent,
  children,
}: {
  title: string;
  isLoading?: boolean;
  /** Nível intermediário no breadcrumb (ex.: Usuários, na página de um usuário). */
  parent?: { href: string; label: string };
  children: ReactNode;
}) {
  const slug = toRouteSlug(title);
  return (
    <PageTransition name={`route-admin-${slug}`}>
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
                <BreadcrumbLink asChild>
                  <Link href="/admin" transitionTypes={["nav-back"]}>
                    Painel
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {parent && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={parent.href} transitionTypes={["nav-back"]}>
                        {parent.label}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </header>
        {isLoading ? (
          <SkeletonTransition name={`skeleton-admin-${slug}`}>{children}</SkeletonTransition>
        ) : (
          <RevealTransition>{children}</RevealTransition>
        )}
      </div>
    </PageTransition>
  );
}
