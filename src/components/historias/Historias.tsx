"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Story } from '../../app/historias/data'; // Corrigido o caminho se necessário e importando apenas Story
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClipboardCopyIcon, CheckIcon } from 'lucide-react'; // Importar ícones

interface HistoriasProps {
  initialHistorias: Story[];
  initialTags: string[];
  isAdmin?: boolean; // Adicionar prop isAdmin
}

export function Historias({ initialHistorias, initialTags, isAdmin }: HistoriasProps) {
  console.log("[Historias.tsx] Props recebidas:", { initialHistorias, initialTags });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('todas');
  const [copiedId, setCopiedId] = useState<string | null>(null); // Estado para feedback de cópia

  // Esta função será usada pelo TanStack Query para buscar dados quando necessário
  // (geralmente só será chamada quando o cache for invalidado ou resetado)
  async function fetchHistoriasClientSide(): Promise<Story[]> {
    console.log("[Historias.tsx] fetchHistoriasClientSide chamada");
    // Numa implementação real, poderíamos buscar do servidor
    // Mas como os dados já foram pré-buscados via prefetchQuery no server
    // e desidratados/hidratados, esta função raramente será chamada
    return initialHistorias;
  }

  // Usar useQuery com a mesma queryKey usada no prefetch
  const { 
    data: historias, 
    isLoading, 
    error,
    status, // Adicionado para log
  } = useQuery<Story[], Error>({
    queryKey: ['historias'], 
    queryFn: fetchHistoriasClientSide,
    // initialData não é necessária, pois estamos usando hydration
    // A configuração abaixo é menos relevante pois o cache vem pre-hidratado
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    console.log("[Historias.tsx] Estado do useQuery:", { 
      historias, 
      isLoading, 
      error, 
      status 
    });
  }, [historias, isLoading, error, status]);

  const filteredHistorias = useMemo(() => {
    console.log("[Historias.tsx] Calculando filteredHistorias. 'historias' do useQuery:", historias);
    if (!historias || !Array.isArray(historias)) {
      console.log("[Historias.tsx] 'historias' do useQuery é undefined ou não é um array, retornando array vazio para filteredHistorias.");
      return [];
    }
    
    // Garantir que TypeScript entenda historias como array de Story
    const historiasList = historias as Story[];
    
    const result = historiasList.filter((story: Story) => {
      const matchesSearchTerm = story.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = (selectedTag && selectedTag !== "todas") ? story.tags.includes(selectedTag) : true;
      return matchesSearchTerm && matchesTag;
    });
    console.log("[Historias.tsx] Resultado de filteredHistorias:", result);
    return result;
  }, [historias, searchTerm, selectedTag]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Resetar após 2 segundos
    }).catch(err => {
      console.error('Falha ao copiar ID: ', err);
      // Adicionar feedback de erro para o usuário se desejado
    });
  };

  if (isLoading && !initialHistorias?.length) {
    console.log("[Historias.tsx] Renderizando: Carregando histórias...");
    return <p>Carregando histórias...</p>; 
  }
  if (error) {
    console.error("[Historias.tsx] Renderizando: Erro ao carregar histórias:", error.message);
    return <p>Erro ao carregar histórias: {error.message}</p>;
  }
  
  console.log("[Historias.tsx] Antes de renderizar a lista. isLoading:", isLoading, "filteredHistorias.length:", filteredHistorias.length);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
        <Input
          type="text"
          placeholder="Pesquisar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Tags</SelectItem>
            {initialTags.map(tag => (
              <SelectItem key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredHistorias.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground">
          Nenhuma história encontrada com os filtros atuais.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHistorias.map((story: Story) => (
          <Card key={story.id} className="flex flex-col overflow-hidden group pt-0">
            <Link href={story.url} target="_blank" rel="noopener noreferrer" className="block">
              {story.imageUrl && (
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={story.imageUrl}
                    alt={`Imagem para ${story.title}`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                </div>
              )}
              <CardHeader className={cn(story.imageUrl ? 'pt-4 pb-4 px-6' : 'p-6')}>
                <div className="flex justify-between items-start">
                  <CardTitle className="hover:text-primary transition-colors flex-grow">
                    {story.title}
                  </CardTitle>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => { 
                        e.preventDefault(); // Prevenir navegação do Link pai
                        e.stopPropagation(); // Prevenir outros eventos
                        handleCopyId(story.id); 
                      }}
                      className="ml-2 shrink-0" // Margem para separar do título
                      title="Copiar ID da História"
                    >
                      {copiedId === story.id ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ClipboardCopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <CardDescription className="h-10 overflow-hidden text-ellipsis mt-1">
                  {story.description}
                </CardDescription>
              </CardHeader>
            </Link>
            <CardContent className="flex-grow">
              <div className="flex flex-wrap gap-2 mt-2">
                {story.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={story.url} target="_blank" rel="noopener noreferrer">
                  Ler História
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 