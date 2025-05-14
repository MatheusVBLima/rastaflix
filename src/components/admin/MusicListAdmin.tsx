"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMusicas } from '@/actions/musicActions';
import { Music } from '@/lib/types';
import { DeleteMusicButton } from './DeleteMusicButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface MusicListAdminProps {
  showDeleteButton?: boolean;
}

export function MusicListAdmin({ showDeleteButton = true }: MusicListAdminProps) {
  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: musicas, isLoading, error } = useQuery<Music[]>({
    queryKey: ['musicas'],
    queryFn: getMusicas,
    staleTime: Infinity, // Match the staleTime from the server
  });

  if (isLoading) {
    return <p className="text-center py-8">Carregando músicas...</p>;
  }

  if (error) {
    return <p className="text-center text-destructive py-8">Erro ao carregar músicas: {(error as Error).message}</p>;
  }

  if (!musicas || musicas.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma música encontrada.</p>;
  }

  return (
    <div className="rounded-md border mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nome</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>URL</TableHead>
            {showDeleteButton && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {musicas.map((music: Music) => (
            <TableRow key={music.id}>
              <TableCell className="font-medium">{music.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">{music.id}</Badge>
              </TableCell>
              <TableCell>
                <a href={music.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px] block">
                  {music.url}
                </a>
              </TableCell>
              {showDeleteButton && (
                <TableCell className="text-right">
                  <DeleteMusicButton musicId={music.id} musicTitle={music.title} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 