"use client";

import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllSeasons, fetchAllCategoriesWithResults } from "@/lib/queries";
import { AwardSeason, CategoryWithResults } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export function ResultsViewer() {
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  const { data: seasons = [] } = useQuery<AwardSeason[]>({
    queryKey: ["seasons"],
    queryFn: fetchAllSeasons,
  });

  const { data: categoriesWithResults = [], isLoading } = useQuery<CategoryWithResults[]>({
    queryKey: ["results", selectedSeasonId],
    queryFn: () => selectedSeasonId ? fetchAllCategoriesWithResults(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Resultados da Votação</h2>

      <div className="mb-6">
        <Select onValueChange={setSelectedSeasonId} value={selectedSeasonId}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Selecione a temporada" />
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} ({s.year}) - {s.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && selectedSeasonId && (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && selectedSeasonId && (
        <div className="space-y-6">
          {categoriesWithResults.map((category) => {
            const sortedNominees = [...category.nominees].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

            // Find the highest vote count
            const maxVotes = sortedNominees.length > 0 ? (sortedNominees[0].vote_count || 0) : 0;

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.name}
                    <Badge variant="outline" className="ml-auto">
                      <Users className="h-3 w-3 mr-1" />
                      {category.total_votes} votos
                    </Badge>
                  </CardTitle>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedNominees.map((nominee) => {
                      // Winner: has the max vote count and it's greater than 0
                      const isWinner = (nominee.vote_count || 0) === maxVotes && maxVotes > 0;
                      return (
                        <div key={nominee.id} className="space-y-2">
                          <div className="flex items-start space-x-3 rounded-lg border p-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                                  <span className={isWinner ? "font-bold" : "font-medium"}>
                                    {nominee.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {nominee.vote_count || 0} votos
                                  </span>
                                  <Badge variant="secondary">
                                    {nominee.percentage?.toFixed(1) || 0}%
                                  </Badge>
                                </div>
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
                                  className="text-sm text-primary hover:underline"
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
                          <Progress value={nominee.percentage || 0} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!selectedSeasonId && (
        <div className="text-center text-muted-foreground py-12">
          Selecione uma temporada para visualizar os resultados
        </div>
      )}
    </div>
  );
}
