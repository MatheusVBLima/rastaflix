"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMusic } from "@/actions/musicActions";
import { fetchMusicas } from "@/lib/queries";
import type { ActionResponse, Music } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { Trash2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function DeleteMusicForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Usar o useQuery que já está com o cache populado graças ao prefetch
  const {
    data: musicas,
    isLoading,
    error,
  } = useQuery<Music[]>({
    queryKey: ["musicas"],
    queryFn: fetchMusicas,
    staleTime: Infinity, // Match the staleTime from the server
  });

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredMusicas = musicas?.filter(
    (music) =>
      music.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      music.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredMusicas?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = filteredMusicas
    ? Math.ceil(filteredMusicas.length / itemsPerPage)
    : 0;

  // Função para mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
          await queryClient.resetQueries({ queryKey: ["musicas"] });
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

  if (error) {
    return (
      <p className="text-center text-destructive py-8">
        Erro ao carregar músicas: {(error as Error).message}
      </p>
    );
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
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={`skeleton-row-${i}`}>
                    <TableCell className="font-medium">
                      <Skeleton className="h-5 w-4/5" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-3/5" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-destructive py-8"
                >
                  Erro ao carregar músicas: {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : currentItems && currentItems.length > 0 ? (
              currentItems.map((music: Music) => (
                <TableRow key={music.id}>
                  <TableCell className="font-medium">{music.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {music.id}
                    </Badge>
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-4 text-muted-foreground"
                >
                  Nenhuma música encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={currentPage === index + 1}
                  onClick={() => paginate(index + 1)}
                  className="cursor-pointer"
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a música "
              <strong>{selectedMusic?.title}</strong>" (ID: {selectedMusic?.id}
              )? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
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
