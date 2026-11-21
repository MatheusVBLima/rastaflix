import Link from "next/link";
import { ArrowRight, LayoutGrid, Smile, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Jogos",
  "Jogos do Universo Ovelhera com ranking global.",
  "/jogos"
);

export default function JogosPage() {
  return (
    <PageTransition name="route-jogos">
      <div className="container mx-auto space-y-10 px-4 py-10 md:px-6">
        <PageHeader
          slug="jogos"
          title="Jogos"
          description="Jogos do Universo Ovelhera para jogar direto no navegador."
        />

        {/* Destaque principal */}
        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">5 mapas</Badge>
                <Badge variant="outline" className="gap-1">
                  <Trophy className="size-3" aria-hidden />
                  Ranking global
                </Badge>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Ovelhera Survivors
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Comece na Ilha do Avô Romeno, passe por Coronel Fabriciano, Rio de Janeiro e
                  Curitiba até enfrentar a Morango na fase final em São Luís.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button asChild size="lg" className="h-11 px-6 font-medium">
                <Link href="/jogos/ilha-do-avo-romeno">
                  Jogar agora
                  <ArrowRight className="ml-2 size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Outros jogos da plataforma */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Outros jogos do Rastaflix
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/ovelhera-dle"
              className="group flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 transition-[border-color,background-color] duration-150 ease-out hover:border-foreground/20 hover:bg-accent/35"
            >
              <div className="flex items-center justify-between">
                <Smile className="size-6 text-primary" aria-hidden />
                <ArrowRight
                  className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-1"
                  aria-hidden
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold">Ovelhera DLE</h3>
                <p className="text-sm text-muted-foreground">
                  Adivinhe as histórias do Ovelhera usando apenas os emojis.
                </p>
              </div>
            </Link>

            <Link
              href="/bingo"
              className="group flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 transition-[border-color,background-color] duration-150 ease-out hover:border-foreground/20 hover:bg-accent/35"
            >
              <div className="flex items-center justify-between">
                <LayoutGrid className="size-6 text-primary" aria-hidden />
                <ArrowRight
                  className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-1"
                  aria-hidden
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold">Bingo Rastafari</h3>
                <p className="text-sm text-muted-foreground">
                  Marque na cartela 4x4 o que acontecer na live.
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
