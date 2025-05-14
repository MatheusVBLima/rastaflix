"use client";

import React, { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInimigos, deleteInimigo } from "@/actions/inimigoActions";
import { Inimigo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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

export function DeleteInimigoForm() {
  const [selectedInimigoId, setSelectedInimigoId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const {
    data: inimigos,
    isLoading: isLoadingInimigos,
    error: errorInimigos,
  } = useQuery<Inimigo[], Error>({
    queryKey: ["inimigos"],
    queryFn: getInimigos,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const handleDelete = async () => {
    if (!selectedInimigoId) {
      toast.error("Selecione um inimigo para excluir.");
      return;
    }
    startTransition(async () => {
      const result = await deleteInimigo(selectedInimigoId);
      if (result.success) {
        toast.success(result.message || "Inimigo excluído com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["inimigos"] });
        setSelectedInimigoId(""); // Limpa a seleção
      } else {
        toast.error(result.message || "Erro ao excluir inimigo.");
      }
    });
  };

  if (isLoadingInimigos) return <p>Carregando inimigos...</p>;
  if (errorInimigos)
    return <p>Erro ao carregar inimigos: {errorInimigos.message}</p>;

  return (
    <div className="space-y-4 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Excluir Inimigo</h2>
      <div className="flex gap-2">
        <Select
          onValueChange={setSelectedInimigoId}
          value={selectedInimigoId}
          disabled={isLoadingInimigos || !inimigos || inimigos.length === 0}
        >
          <SelectTrigger className="flex-grow">
            <SelectValue placeholder="Selecione um inimigo para excluir" />
          </SelectTrigger>
          <SelectContent>
            {inimigos && inimigos.length > 0 ? (
              inimigos.map((inimigo) => (
                <SelectItem key={inimigo.id} value={inimigo.id}>
                  {inimigo.nome} (Status: {inimigo.status})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-inimigos" disabled>
                Nenhum inimigo encontrado
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={!selectedInimigoId || isPending}
              className="flex-shrink-0"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o
                inimigo selecionado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Excluindo...
                  </>
                ) : (
                  "Confirmar Exclusão"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
