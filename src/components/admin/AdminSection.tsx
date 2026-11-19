import Link from "next/link";
import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** Layout comum das páginas de gestão: breadcrumb completo, título e conteúdo. */
export function AdminSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageTransition>
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
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </header>
        {children}
      </div>
    </PageTransition>
  );
}
