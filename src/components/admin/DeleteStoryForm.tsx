"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteStory, getHistorias } from '@/actions/storyActions';
import type { ActionResponse, Story } from '@/lib/types';
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

export function DeleteStoryForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const { data: historias, isLoading, error } = useQuery<Story[]>({
    queryKey: ['historias'],
    queryFn: getHistorias,
    staleTime: Infinity, // Match the staleTime from the server
  });

  const handleDelete = async () => {
    if (!selectedStory) return;
    
    startTransition(async () => {
      try {
        const result = await deleteStory(selectedStory.id);
        if (result.success) {
          // Mostrar toast de sucesso primeiro, para feedback imediato
          toast.success("História deletada com sucesso!", {
            description: `A história "${selectedStory.title}" foi removida.`,
            position: "bottom-right",
          });
          
          // Depois atualizar a UI
          router.refresh(); 
          await queryClient.resetQueries({ queryKey: ['historias'] });
          setSelectedStory(null);
        } else {
          // Mostrar toast de erro
          toast.error("Falha ao deletar história", {
            description: result.message,
            position: "bottom-right",
          });
        }
      } catch (error) {
        // Lidar com erros inesperados
        toast.error("Erro inesperado", {
          description: "Ocorreu um erro ao tentar deletar a história",
          position: "bottom-right",
        });
        console.error("Erro ao deletar história:", error);
      } finally {
        // Sempre fechar o diálogo, independentemente do resultado
        setIsDialogOpen(false);
      }
    });
  };

  const filteredHistorias = historias?.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Deletar História</h2>

      <div className="mb-4">
        <Label htmlFor="searchTerm">Buscar história</Label>
        <Input 
          id="searchTerm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite o título ou ID da história"
          className="mt-1"
        />
      </div>

      <div className="rounded-md border mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Título</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistorias?.map((story: Story) => (
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
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      setSelectedStory(story);
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
              Tem certeza que deseja deletar a história "<strong>{selectedStory?.title}</strong>" (ID: {selectedStory?.id})?
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