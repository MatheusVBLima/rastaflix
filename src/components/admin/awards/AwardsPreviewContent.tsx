"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Award, ExternalLink } from "lucide-react";
import { fetchVotingData } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { AwardSeason, VotingData } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABEL: Record<AwardSeason["status"], string> = {
  active: "Votação aberta",
  closed: "Votação encerrada",
  draft: "Rascunho",
};

function AwardsPreviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando preview">
      <div className="space-y-2.5 rounded-xl border bg-card p-5">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex gap-3 rounded-lg border bg-background/60 p-3">
                  <Skeleton className="size-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2 py-0.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3.5 w-3/5" />
                  </div>
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AwardsPreviewContentProps {
  seasonId: string;
}

export function AwardsPreviewContent({ seasonId }: AwardsPreviewContentProps) {
  const { data: votingData, isLoading } = useQuery<VotingData | null>({
    queryKey: queryKeys.rastaAwards.votingData(seasonId),
    queryFn: () => (seasonId ? fetchVotingData(seasonId) : null),
    enabled: !!seasonId,
  });

  if (isLoading) {
    return <AwardsPreviewSkeleton />;
  }

  if (!votingData) {
    return (
      <EmptyState
        icon={Award}
        title="Nenhum dado disponível"
        description="Esta temporada ainda não possui categorias ou indicados."
      />
    );
  }

  const { season, categories } = votingData;
  const isActive = season.status === "active";
  const isClosed = season.status === "closed";
  const repeatsPageTitle = season.title.trim().toLowerCase() === "rasta awards";
  const seasonHeading = repeatsPageTitle && season.description ? season.description : season.title;
  const seasonDescription = seasonHeading === season.description ? null : season.description;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da temporada — espelha RastaAwardsVoting */}
      <section className="space-y-2 rounded-xl border bg-card p-5">
        <Badge variant={isActive ? "default" : isClosed ? "secondary" : "outline"}>
          {STATUS_LABEL[season.status]}
        </Badge>
        <h3 className="font-display text-2xl font-semibold tracking-tight">
          {seasonHeading}
        </h3>
        {seasonDescription && (
          <p className="max-w-prose text-sm text-muted-foreground">{seasonDescription}</p>
        )}
        <p className="text-sm tabular-nums text-muted-foreground">
          {formatDate(season.start_date)} – {formatDate(season.end_date)}
        </p>
      </section>

      {categories.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Nenhuma categoria ainda"
          description="Crie categorias na aba ao lado para vê-las aqui."
        />
      ) : (
        <div className="space-y-5">
          {categories.map((category) => (
            <section
              key={category.id}
              className="space-y-4 rounded-xl border bg-card p-5"
            >
              <header className="space-y-1">
                <h4 className="text-base font-semibold">{category.name}</h4>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </header>

              {category.nominees.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                  Nenhum indicado nesta categoria ainda.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {category.nominees.map((nominee) => (
                    <div
                      key={nominee.id}
                      className="flex gap-3 rounded-lg border bg-background/60 p-3"
                    >
                      {nominee.image_url ? (
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={nominee.image_url}
                            alt={nominee.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-snug">{nominee.title}</p>
                        {nominee.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {nominee.description}
                          </p>
                        )}
                        {nominee.content_link && (
                          <a
                            href={nominee.content_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Ver conteúdo <ExternalLink className="size-3" aria-hidden />
                          </a>
                        )}
                      </div>
                      <span
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 rounded-full border border-muted-foreground/40"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
