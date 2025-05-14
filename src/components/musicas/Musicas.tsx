"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Music } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClipboardCopyIcon, CheckIcon } from "lucide-react";

interface MusicasProps {
  initialMusicas: Music[];
  isAdmin?: boolean;
}

export function Musicas({ initialMusicas, isAdmin }: MusicasProps) {
  console.log("[Musicas.tsx] Props recebidas:", { initialMusicas });

  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Esta função será usada pelo TanStack Query para buscar dados quando necessário
  async function fetchMusicasClientSide(): Promise<Music[]> {
    console.log("[Musicas.tsx] fetchMusicasClientSide chamada");
    return initialMusicas;
  }

  // Usar useQuery com a mesma queryKey usada no prefetch
  const {
    data: musicas,
    isLoading,
    error,
  } = useQuery<Music[], Error>({
    queryKey: ["musicas"],
    queryFn: fetchMusicasClientSide,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const filteredMusicas = useMemo(() => {
    console.log(
      "[Musicas.tsx] Calculando filteredMusicas. 'musicas' do useQuery:",
      musicas
    );
    if (!musicas || !Array.isArray(musicas)) {
      console.log(
        "[Musicas.tsx] 'musicas' do useQuery é undefined ou não é um array, retornando array vazio para filteredMusicas."
      );
      return [];
    }

    const musicasList = musicas as Music[];

    const result = musicasList.filter((music: Music) => {
      const matchesSearchTerm = music.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearchTerm;
    });

    return result;
  }, [musicas, searchTerm]);

  const handleCopyId = (id: string) => {
    navigator.clipboard
      .writeText(id)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error("Falha ao copiar ID: ", err);
      });
  };

  if (isLoading && !initialMusicas?.length) {
    return <p>Carregando músicas...</p>;
  }

  if (error) {
    return <p>Erro ao carregar músicas: {error.message}</p>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <Input
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredMusicas.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground">
          Nenhuma música encontrada com os filtros atuais.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredMusicas.map((music: Music) => (
          <Link
            href={music.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            key={music.id}
          >
            <Card
              key={music.id}
              className="flex flex-col h-full overflow-hidden group pt-0"
            >
              <div className="flex flex-col h-full">
                {music.imageUrl && (
                  <div className="relative w-full pt-[56.25%] overflow-hidden">
                    <Image
                      src={music.imageUrl}
                      alt={`Imagem para ${music.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                  </div>
                )}

                <CardContent className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
                      {music.title}
                    </h3>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleCopyId(music.id)}
                        className="ml-2 shrink-0 h-8 w-8"
                        title="Copiar ID da Música"
                      >
                        {copiedId === music.id ? (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClipboardCopyIcon className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href={music.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvir Música
                    </Link>
                  </Button>
                </CardFooter>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
