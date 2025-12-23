"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { fetchMusicas } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Music } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Music2, Search } from "lucide-react";

interface MusicasProps {
  initialMusicas: Music[];
  isAdmin?: boolean;
}

export function Musicas({ initialMusicas, isAdmin }: MusicasProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Usar useQuery com a mesma queryKey usada no prefetch
  // A queryFn usa fetchMusicas real para que invalidateQueries funcione corretamente
  const {
    data: musicas,
    isLoading,
    error,
  } = useQuery<Music[], Error>({
    queryKey: ["musicas"],
    queryFn: fetchMusicas,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const filteredMusicas = useMemo(() => {
    if (!musicas || !Array.isArray(musicas)) {
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

  if (isLoading && !initialMusicas?.length) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <Input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            disabled
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              className="flex flex-col h-full overflow-hidden"
            >
              <Skeleton className="relative w-full pt-[56.25%]" />
              <CardContent className="p-4 flex-grow">
                <Skeleton className="h-6 w-3/4 mb-2" />
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p>Erro ao carregar músicas: {error.message}</p>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-start">
        <Input
          type="text"
          placeholder="Pesquisar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm w-full"
        />
      </div>

      {filteredMusicas.length === 0 && !isLoading && (
        <EmptyState
          icon={musicas && musicas.length > 0 && searchTerm ? Search : Music2}
          title={musicas && musicas.length > 0 && searchTerm ? "Nenhuma música encontrada" : "Nenhuma música cadastrada"}
          description={
            musicas && musicas.length > 0 && searchTerm
              ? `Não encontramos músicas que correspondam a "${searchTerm}". Tente pesquisar com outros termos.`
              : "Ainda não há músicas cadastradas no sistema. Fique atento para novas adições!"
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {music.url && (
                  <div className="relative w-full pt-[56.25%] overflow-hidden">
                    <Image
                      src={(() => {
                        try {
                          // Tentar extrair ID do YouTube da URL
                          const urlObj = new URL(music.url);
                          if (
                            urlObj.hostname.includes("youtube.com") ||
                            urlObj.hostname.includes("youtu.be")
                          ) {
                            // Extrair videoId para URLs padrão do YouTube
                            let videoId = urlObj.searchParams.get("v");

                            // Formato youtu.be/ID
                            if (
                              !videoId &&
                              urlObj.hostname.includes("youtu.be")
                            ) {
                              videoId = urlObj.pathname.substring(1);
                            }

                            if (videoId) {
                              // Construir URL da thumbnail diretamente
                              return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                            }
                          }
                          // Se não conseguir extrair do YouTube, usar a URL da imagem salva
                          return music.imageUrl || "/placeholder.png";
                        } catch (e) {
                          // Fallback para qualquer erro
                          return music.imageUrl || "/placeholder.png";
                        }
                      })()}
                      alt={`Imagem para ${music.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                      onError={(e) => {
                        // Fallback para imagem padrão se a thumbnail falhar
                        const imgElement = e.currentTarget;
                        imgElement.src = "/placeholder.png";
                      }}
                    />
                  </div>
                )}

                <CardContent className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
                      {music.title}
                    </h3>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 mt-auto">
                  <Button className="w-full" tabIndex={-1}>
                    Ouvir Música
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
