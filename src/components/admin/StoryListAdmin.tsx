"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Story } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DeleteStoryButton } from './DeleteStoryButton'; 
import { fetchHistorias } from '@/lib/queries';

interface StoryListAdminProps {
  showDeleteButton?: boolean;
}

export function StoryListAdmin({ showDeleteButton = true }: StoryListAdminProps) {
  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: historias, isLoading, error } = useQuery<Story[]>({
    queryKey: ['historias'],
    queryFn: fetchHistorias,
    staleTime: Infinity, // Match the staleTime from the server
  });

  if (isLoading) {
    return <p className="text-center py-8">Carregando histórias...</p>;
  }

  if (error) {
    return <p className="text-center text-destructive py-8">Erro ao carregar histórias: {(error as Error).message}</p>;
  }

  if (!historias || historias.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma história encontrada.</p>;
  }

  return (
    <div className="rounded-md border mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Título</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>URL</TableHead>
            {showDeleteButton && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {historias.map((story: Story) => (
            <TableRow key={story.id}>
              <TableCell className="font-medium">{story.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">{story.id}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {story.tags && story.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px] block">
                  {story.url}
                </a>
              </TableCell>
              {showDeleteButton && (
                <TableCell className="text-right">
                  <DeleteStoryButton storyId={story.id} storyTitle={story.title} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 