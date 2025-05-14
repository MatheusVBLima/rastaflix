"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMusic } from '@/actions/musicActions';
import type { ActionResponse } from '@/lib/types';
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

interface DeleteMusicButtonProps {
  musicId: string;
  musicTitle: string;
}

export function DeleteMusicButton({ musicId, musicTitle }: DeleteMusicButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteMusic(musicId);
        if (result.success) {
          // Mostrar toast de sucesso
          toast.success("Música deletada com sucesso!", {
            description: `A música "${musicTitle}" foi removida.`,
            position: "bottom-right",
          });
          
          // Atualizar a UI
          router.refresh(); 
          await queryClient.resetQueries({ queryKey: ['musicas'] });
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

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100">
          <Trash2Icon className="h-4 w-4" />
          <span className="sr-only">Deletar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Esta operação irá remover permanentemente a música 
            <span className="font-semibold"> "{musicTitle}" </span>
            do banco de dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white"
            disabled={isPending}
          >
            {isPending ? 'Deletando...' : 'Deletar Música'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 