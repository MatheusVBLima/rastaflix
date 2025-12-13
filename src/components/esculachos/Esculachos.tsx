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
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayerComplete, AudioPlayerProvider } from "@/components/ui/audio-player-eleven";

interface EsculachosProps {
  initialEsculachos: Esculacho[];
}

// Componente separado para gerenciar Blob URL e limpeza
function EsculachoAudio({ 
  audioData, 
  titulo, 
  esculachoId 
}: { 
  audioData: string; 
  titulo: string; 
  esculachoId: string;
}) {
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      // Decodificar base64
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Criar Blob e URL
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Limpar URL quando componente desmontar
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Erro ao criar Blob URL:", error);
      // Fallback para data URI
      setAudioUrl(`data:audio/wav;base64,${audioData}`);
    }
  }, [audioData]);

  const downloadUrl = React.useMemo(() => {
    try {
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      return URL.createObjectURL(blob);
    } catch {
      return `data:audio/wav;base64,${audioData}`;
    }
  }, [audioData]);

  // Limpar downloadUrl quando componente desmontar
  React.useEffect(() => {
    return () => {
      if (downloadUrl && downloadUrl.startsWith("blob:")) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  if (!audioUrl) {
    return <p className="text-sm text-muted-foreground">Carregando áudio...</p>;
  }

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
          href={downloadUrl}
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

      {!isLoading && filteredEsculachos.length === 0 && !searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum esculacho encontrado.
        </p>
      )}
      {!isLoading && filteredEsculachos.length === 0 && searchTerm && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum esculacho encontrado para &quot;{searchTerm}&quot;.
        </p>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {esculacho.audio_data ? (
                  <EsculachoAudio 
                    audioData={esculacho.audio_data} 
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
