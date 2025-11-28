"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchVotingData } from "@/lib/queries";
import { VotingData } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Award } from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";

interface AwardsPreviewContentProps {
  seasonId: string;
}

export function AwardsPreviewContent({ seasonId }: AwardsPreviewContentProps) {
  const { data: votingData, isLoading } = useQuery<VotingData | null>({
    queryKey: ["votingData", seasonId],
    queryFn: () => seasonId ? fetchVotingData(seasonId) : null,
    enabled: !!seasonId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!votingData) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Award}
          title="Nenhum dado disponível"
          description="Esta temporada ainda não possui categorias ou nominados."
        />
      </div>
    );
  }

  const isActive = votingData.season.status === "active";
  const isClosed = votingData.season.status === "closed";
  const isDraft = votingData.season.status === "draft";

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-500" />
          {votingData.season.title}
        </h2>
        {votingData.season.description && (
          <p className="text-muted-foreground mb-4 text-sm">{votingData.season.description}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(votingData.season.start_date).toLocaleDateString("pt-BR")} -{" "}
            {new Date(votingData.season.end_date).toLocaleDateString("pt-BR")}
          </div>
          <Badge variant={isActive ? "default" : isClosed ? "secondary" : "outline"}>
            {isActive && "Votação Ativa"}
            {isClosed && "Votação Encerrada"}
            {isDraft && "Rascunho"}
          </Badge>
        </div>
      </div>

      {/* Categorias */}
      {votingData.categories.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>Nenhuma categoria adicionada ainda.</p>
          <p className="text-sm mt-2">Crie categorias usando o formulário ao lado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {votingData.categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.name}
                </CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {category.nominees.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 border rounded-lg bg-muted/20">
                    <p className="text-sm">Nenhum nominado nesta categoria ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {category.nominees.map((nominee) => (
                      <div
                        key={nominee.id}
                        className="flex items-start space-x-3 rounded-lg border p-4 bg-background"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{nominee.title}</span>
                          </div>
                          {nominee.description && (
                            <p className="text-sm text-muted-foreground">
                              {nominee.description}
                            </p>
                          )}
                          {nominee.content_link && (
                            <a
                              href={nominee.content_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-block"
                            >
                              Ver conteúdo →
                            </a>
                          )}
                        </div>
                        {nominee.image_url && (
                          <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={nominee.image_url}
                              alt={nominee.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
