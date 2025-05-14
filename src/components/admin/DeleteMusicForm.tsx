"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMusic, getMusicas } from '@/actions/musicActions';
import type { ActionResponse, Music } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2Icon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';

export function DeleteMusicForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: musicas, isLoading, error } = useQuery<Music[]>({
    queryKey: ['musicas'],
    queryFn: getMusicas,
    staleTime: Infinity, // Match the staleTime from the server
  });

  const handleDelete = async () => {
    if (!selectedMusic) return;
    
    startTransition(async () => {
      try {
        const result = await deleteMusic(selectedMusic.id);
        if (result.success) {
          // Mostrar toast de sucesso primeiro, para feedback imediato
          toast.success("Música deletada com sucesso!", {
            description: `A música "${selectedMusic.title}" foi removida.`,
            position: "bottom-right",
          });
          
          // Depois atualizar a UI
          router.refresh(); 
          await queryClient.resetQueries({ queryKey: ['musicas'] });
          setSelectedMusic(null);
        } else {
          // Mostrar toast de erro
          toast.error("Falha ao deletar música", {
            description: result.message,
            position: "bottom-right",
          });
        }
      } catch (error) {
        // Lidar com erros inesperados
        toast.error("Erro inesperado", {
          description: "Ocorreu um erro ao tentar deletar a música",
          position: "bottom-right",
        });
        console.error("Erro ao deletar música:", error);
      } finally {
        // Sempre fechar o diálogo, independentemente do resultado
        setIsDialogOpen(false);
      }
    });
  };

  const filteredMusicas = musicas?.filter(music => 
    music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    music.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Deletar Música</h2>

      <div className="mb-4">
        <Label htmlFor="searchTerm">Buscar música</Label>
        <Input 
          id="searchTerm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite o título ou ID da música"
          className="mt-1"
        />
      </div>

      <div className="rounded-md border mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Título</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMusicas?.map((music: Music) => (
              <TableRow key={music.id}>
                <TableCell className="font-medium">{music.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">{music.id}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      setSelectedMusic(music);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Deletar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a música "<strong>{selectedMusic?.title}</strong>" (ID: {selectedMusic?.id})?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)} disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 