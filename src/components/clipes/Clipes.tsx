"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { fetchClipes } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clipe, ClipePlatform } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface ClipesProps {
  initialClipes: Clipe[];
}

export function Clipes({ initialClipes }: ClipesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const {
    data: clipes,
    isLoading,
    error,
  } = useQuery<Clipe[], Error>({
    queryKey: ["clipes"],
    queryFn: fetchClipes,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Contadores de cada plataforma (independentes do filtro de plataforma selecionada)
  const platformCounts = useMemo(() => {
    if (!clipes || !Array.isArray(clipes)) {
      return { all: 0, twitch: 0, kick: 0 };
    }

    const filteredBySearch = clipes.filter((clipe: Clipe) =>
      clipe.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      all: filteredBySearch.length,
      twitch: filteredBySearch.filter((c) => c.plataforma === "twitch").length,
      kick: filteredBySearch.filter((c) => c.plataforma === "kick").length,
    };
  }, [clipes, searchTerm]);

  const filteredClipes = useMemo(() => {
    if (!clipes || !Array.isArray(clipes)) {
      return [];
    }

    return clipes.filter((clipe: Clipe) => {
      const matchesSearchTerm = clipe.titulo
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPlatform =
        selectedPlatform === "all" || clipe.plataforma === selectedPlatform;
      return matchesSearchTerm && matchesPlatform;
    });
  }, [clipes, searchTerm, selectedPlatform]);

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case "twitch":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "kick":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitch":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
        );
      case "kick":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.333 0v24h5.334V12l5.333 5.333V24h5.333V12L24 18.667V5.333L17.333 12V0H12v6.667L6.667 12V0z" />
          </svg>
        );
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  if (isLoading && !initialClipes?.length) {
    return <p>Carregando clipes...</p>;
  }
  if (error) {
    return <p>Erro ao carregar clipes: {error.message}</p>;
  }

  // Filtrar clipes por plataforma para exibição nas abas
  const twitchClipes = filteredClipes.filter((c) => c.plataforma === "twitch");
  const kickClipes = filteredClipes.filter((c) => c.plataforma === "kick");

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Clipes</h1>
        <p className="text-muted-foreground">
          Os melhores momentos das lives do Ovelhera
        </p>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Pesquisar clipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedPlatform}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            Todos ({platformCounts.all})
          </TabsTrigger>
          <TabsTrigger value="twitch" className="gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
            </svg>
            Twitch ({platformCounts.twitch})
          </TabsTrigger>
          <TabsTrigger value="kick" className="gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.333 0v24h5.334V12l5.333 5.333V24h5.333V12L24 18.667V5.333L17.333 12V0H12v6.667L6.667 12V0z" />
            </svg>
            Kick ({platformCounts.kick})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ClipesGrid 
            clipes={filteredClipes} 
            allClipes={clipes || []}
            hasFilters={!!searchTerm || selectedPlatform !== "all"}
            getPlatformBadgeColor={getPlatformBadgeColor} 
            getPlatformIcon={getPlatformIcon} 
          />
        </TabsContent>

        <TabsContent value="twitch">
          <ClipesGrid 
            clipes={twitchClipes} 
            allClipes={clipes || []}
            hasFilters={!!searchTerm || selectedPlatform !== "all"}
            getPlatformBadgeColor={getPlatformBadgeColor} 
            getPlatformIcon={getPlatformIcon} 
          />
        </TabsContent>

        <TabsContent value="kick">
          <ClipesGrid 
            clipes={kickClipes} 
            allClipes={clipes || []}
            hasFilters={!!searchTerm || selectedPlatform !== "all"}
            getPlatformBadgeColor={getPlatformBadgeColor} 
            getPlatformIcon={getPlatformIcon} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ClipesGridProps {
  clipes: Clipe[];
  allClipes: Clipe[];
  hasFilters: boolean;
  getPlatformBadgeColor: (platform: string) => string;
  getPlatformIcon: (platform: string) => React.ReactNode;
}

function ClipesGrid({ clipes, allClipes, hasFilters, getPlatformBadgeColor, getPlatformIcon }: ClipesGridProps) {
  if (clipes.length === 0) {
    return (
      <EmptyState
        icon={allClipes.length > 0 && hasFilters ? Search : Play}
        title={allClipes.length > 0 && hasFilters ? "Nenhum clipe encontrado" : "Nenhum clipe cadastrado"}
        description={
          allClipes.length > 0 && hasFilters
            ? "Não encontramos clipes que correspondam aos filtros selecionados. Tente ajustar a pesquisa ou selecionar outra plataforma."
            : "Ainda não há clipes cadastrados no sistema. Fique atento para novas adições!"
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clipes.map((clipe: Clipe) => (
        <Link
          href={clipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          key={clipe.id}
        >
          <Card className="flex flex-col h-full overflow-hidden group pt-0 hover:border-primary/50 transition-colors">
            <div className="relative w-full pt-[56.25%] overflow-hidden bg-muted">
              {clipe.thumbnail_url ? (
                <Image
                  src={clipe.thumbnail_url}
                  alt={`Thumbnail de ${clipe.titulo}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                  onError={(e) => {
                    const imgElement = e.currentTarget;
                    imgElement.src = "/placeholder.png";
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge className={`${getPlatformBadgeColor(clipe.plataforma)} gap-1`}>
                  {getPlatformIcon(clipe.plataforma)}
                  {clipe.plataforma}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col flex-grow p-4">
              <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2 mb-4">
                {clipe.titulo}
              </h3>

              <Button className="w-full mt-auto cursor-pointer gap-2" tabIndex={-1}>
                <ExternalLink className="w-4 h-4" />
                Assistir Clipe
              </Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
