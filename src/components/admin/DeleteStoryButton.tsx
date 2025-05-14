"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteStory } from '@/actions/storiesActions';
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
import { useFormState } from 'react-dom'; // Para feedback da action, opcional aqui mas pode ser útil
import { useQueryClient } from '@tanstack/react-query'; // Importar useQueryClient
import { toast } from 'sonner';

interface DeleteStoryButtonProps {
  storyId: string;
  storyTitle: string;
}

export function DeleteStoryButton({ storyId, storyTitle }: DeleteStoryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient(); // Obter o queryClient

  // Opcional: usar useFormState para feedback mais detalhado se a action deleteStory o suportar
  // const initialState: ActionResponse = { success: false, message: "" };
  // const [state, formAction] = useFormState(deleteStory.bind(null, storyId), initialState);
  // No nosso caso, deleteStory já retorna uma Promise<ActionResponse> e não usa prevState.

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteStory(storyId);
        if (result.success) {
          // Mostrar toast de sucesso primeiro, para feedback imediato
          toast.success("História deletada com sucesso!", {
            description: `A história "${storyTitle}" foi removida.`,
            position: "top-center",
          });
          
          // Depois atualizar a UI
          router.refresh(); 
          await queryClient.resetQueries({ queryKey: ['historias'] });
        } else {
          // Mostrar toast de erro
          toast.error("Falha ao deletar história", {
            description: result.message,
            position: "top-center",
          });
        }
      } catch (error) {
        // Lidar com erros inesperados
        toast.error("Erro inesperado", {
          description: "Ocorreu um erro ao tentar deletar a história",
          position: "top-center",
        });
        console.error("Erro ao deletar história:", error);
      } finally {
        // Sempre fechar o diálogo, independentemente do resultado
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Deletar História" className="text-red-500 hover:text-red-700">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar a história "<strong>{storyTitle}</strong>" (ID: {storyId})?
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
  );
} 