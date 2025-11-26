"use client";

import React, { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchActiveSeason, fetchVotingData, fetchUserVotes } from "@/lib/queries";
import { submitVote } from "@/actions/awardActions";
import { AwardSeason, VotingData, AwardVote } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Trophy, Lock, CheckCircle2, Calendar, Info, Award } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";

interface RastaAwardsVotingProps {
  userId: string | null;
}

export function RastaAwardsVoting({ userId }: RastaAwardsVotingProps) {
  const [isPending, startTransition] = useTransition();
  const [votingCategoryId, setVotingCategoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: activeSeason } = useQuery<AwardSeason | null>({
    queryKey: ["activeSeason"],
    queryFn: fetchActiveSeason,
  });

  const { data: votingData } = useQuery<VotingData | null>({
    queryKey: ["votingData", activeSeason?.id],
    queryFn: () => activeSeason ? fetchVotingData(activeSeason.id) : null,
    enabled: !!activeSeason,
  });

  const { data: userVotes = [] } = useQuery<AwardVote[]>({
    queryKey: ["userVotes", userId, activeSeason?.id],
    queryFn: () => userId && activeSeason ? fetchUserVotes(userId, activeSeason.id) : [],
    enabled: !!userId && !!activeSeason,
  });

  async function handleVote(categoryId: string, nomineeId: string) {
    if (!userId) {
      toast.error("Você precisa estar logado para votar");
      return;
    }

    if (!activeSeason) {
      toast.error("Nenhuma temporada ativa");
      return;
    }

    setVotingCategoryId(categoryId);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("category_id", categoryId);
      formData.append("nominee_id", nomineeId);
      formData.append("season_id", activeSeason.id);

      const result = await submitVote(formData);

      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["userVotes", userId, activeSeason.id] });
      } else {
        toast.error(result.message);
      }
      setVotingCategoryId(null);
    });
  }

  // Verificar voto do usuário para uma categoria
  function getUserVoteForCategory(categoryId: string): string | null {
    const vote = userVotes.find((v) => v.category_id === categoryId);
    return vote?.nominee_id || null;
  }

  if (!activeSeason) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={Award}
          title="Nenhuma votação ativa"
          description="Não há nenhuma temporada de votação ativa no momento. Fique atento às próximas edições do Rasta Awards!"
        />
      </div>
    );
  }

  if (!votingData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const isActive = activeSeason.status === "active";
  const isClosed = activeSeason.status === "closed";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          {votingData.season.title}
        </h1>
        {votingData.season.description && (
          <p className="text-muted-foreground mb-4">{votingData.season.description}</p>
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
            {!isActive && !isClosed && "Rascunho"}
          </Badge>
        </div>
      </div>

      {/* Status de autenticação */}
      {!userId && isActive && (
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertTitle>Faça login para votar</AlertTitle>
          <AlertDescription>
            Você precisa estar logado para participar da votação.{" "}
            <Link href="/sign-in" className="underline font-medium">
              Clique aqui para fazer login
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Votação encerrada */}
      {isClosed && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Votação Encerrada</AlertTitle>
          <AlertDescription>
            Esta temporada já foi encerrada. Os resultados foram divulgados!
          </AlertDescription>
        </Alert>
      )}

      {/* Categorias */}
      <div className="space-y-6">
        {votingData.categories.map((category) => {
          const userVote = getUserVoteForCategory(category.id);
          const isVoting = votingCategoryId === category.id;

          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.name}
                  {userVote && (
                    <Badge variant="outline" className="ml-auto">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Você votou
                    </Badge>
                  )}
                </CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={userVote || undefined}
                  onValueChange={(nomineeId: string) => handleVote(category.id, nomineeId)}
                  disabled={!userId || !isActive || isVoting}
                >
                  <div className="space-y-3">
                    {category.nominees.map((nominee) => (
                      <div
                        key={nominee.id}
                        className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                          userVote === nominee.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent"
                        }`}
                      >
                        <RadioGroupItem
                          value={nominee.id}
                          id={nominee.id}
                          disabled={!userId || !isActive || isVoting}
                        />
                        <Label
                          htmlFor={nominee.id}
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{nominee.title}</span>
                            {userVote === nominee.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver conteúdo →
                            </a>
                          )}
                        </Label>
                        {nominee.image_url && (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
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
                </RadioGroup>
                {isVoting && (
                  <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registrando voto...
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
