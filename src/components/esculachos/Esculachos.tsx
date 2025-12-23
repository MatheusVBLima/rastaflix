"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEsculachos } from "@/lib/queries";
import { Esculacho } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Mic } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayerComplete, AudioPlayerProvider } from "@/components/ui/audio-player-eleven";
import { EmptyState } from "@/components/ui/empty-state";

interface EsculachosProps {
  initialEsculachos: Esculacho[];
}

// Componente simplificado para áudio - usa URL direta do Supabase Storage
// IMPORTANTE: Este componente deve estar dentro de um AudioPlayerProvider
function EsculachoAudio({ 
  audioUrl, 
  titulo, 
  esculachoId 
}: { 
  audioUrl: string; 
  titulo: string; 
  esculachoId: string;
}) {
  // AudioPlayerComplete usa useAudioPlayer() hook que requer AudioPlayerProvider
  // Este componente é renderizado dentro de Esculachos que já tem o provider
  return (
    <div className="w-full space-y-2">
      <AudioPlayerComplete
        item={{
          id: esculachoId,
          src: audioUrl,
        }}
        className="w-full"
        showSpeedControl={true}
      />
      <Button variant="outline" size="sm" className="w-full" asChild>
        <a
          href={audioUrl}
          download={`${titulo.replace(/[^a-zA-Z0-9]/g, "_")}.wav`}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar Áudio
        </a>
      </Button>
    </div>
  );
}

export function Esculachos({ initialEsculachos }: EsculachosProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: esculachos,
    isLoading,
    error,
  } = useQuery<Esculacho[], Error>({
    queryKey: ["esculachos"],
    queryFn: fetchEsculachos,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const filteredEsculachos = useMemo(() => {
    if (!esculachos) {
      return [];
    }
    if (!searchTerm) {
      return esculachos;
    }
    return esculachos.filter(
      (esculacho) =>
        esculacho.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (esculacho.descricao &&
          esculacho.descricao
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        esculacho.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (esculacho.autor &&
          esculacho.autor.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, esculachos]);

  if (error) {
    return <p>Erro ao carregar esculachos: {error.message}</p>;
  }

  return (
    <AudioPlayerProvider>
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="Pesquisar esculachos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          disabled={isLoading}
        />
      </div>

      {!isLoading && filteredEsculachos.length === 0 && (
        <EmptyState
          icon={esculachos && esculachos.length > 0 && searchTerm ? Search : Mic}
          title={esculachos && esculachos.length > 0 && searchTerm ? "Nenhum esculacho encontrado" : "Nenhum esculacho cadastrado"}
          description={
            esculachos && esculachos.length > 0 && searchTerm
              ? `Não encontramos esculachos que correspondam a "${searchTerm}". Tente pesquisar com outros termos.`
              : "Ainda não há esculachos cadastrados no sistema. Fique atento para novas adições!"
          }
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              className="flex flex-col h-full overflow-hidden"
            >
              <Skeleton className="h-20 w-full" />
              <CardContent className="flex-grow p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && esculachos && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEsculachos.map((esculacho) => (
            <Card key={esculacho.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{esculacho.titulo}</CardTitle>
                {esculacho.descricao && (
                  <CardDescription className="italic">
                    {esculacho.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm whitespace-pre-wrap">
                  {esculacho.conteudo}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-3 pt-4">
                <div className="flex flex-wrap gap-2">
                  {esculacho.autor && (
                    <Badge variant="outline">Autor: {esculacho.autor}</Badge>
                  )}
                </div>
                {esculacho.audio_url ? (
                  <EsculachoAudio 
                    audioUrl={esculacho.audio_url} 
                    titulo={esculacho.titulo}
                    esculachoId={esculacho.id}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground w-full text-center">
                    Áudio não disponível
                  </p>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AudioPlayerProvider>
  );
}
