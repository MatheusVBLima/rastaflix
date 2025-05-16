"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEsculacho, getEsculachos } from "@/actions/esculachoActions"; // Atualizado
import type { ActionResponse, Esculacho } from "@/lib/types"; // Atualizado
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
} from "@/components/ui/alert-dialog";
import { Trash2Icon } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function DeleteEsculachoForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEsculacho, setSelectedEsculacho] = useState<Esculacho | null>(
    null
  ); // Atualizado
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  const {
    data: esculachos,
    isLoading,
    error,
  } = useQuery<Esculacho[]>({
    queryKey: ["esculachos"], // Atualizado
    queryFn: getEsculachos, // Atualizado
    // staleTime: Infinity, // Removido ou ajustado conforme necessidade
  });

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredEsculachos = esculachos?.filter(
    (item) =>
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.autor &&
        item.autor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentItems = filteredEsculachos?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = filteredEsculachos
    ? Math.ceil(filteredEsculachos.length / itemsPerPage)
    : 0;

  // Função para mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleDelete = async () => {
    if (!selectedEsculacho) return;

    startTransition(async () => {
      try {
        const result = await deleteEsculacho(selectedEsculacho.id); // Atualizado
        if (result.success) {
          toast.success("Esculacho deletado com sucesso!", {
            // Atualizado
            description: `O esculacho "${selectedEsculacho.titulo}" foi removido.`,
            position: "bottom-right",
          });
          router.refresh();
          queryClient.invalidateQueries({ queryKey: ["esculachos"] }); // Atualizado
          setSelectedEsculacho(null);
        } else {
          toast.error("Falha ao deletar esculacho", {
            description: result.message,
          }); // Atualizado
        }
      } catch (err) {
        toast.error("Erro inesperado", {
          description: "Ocorreu um erro ao tentar deletar o esculacho",
        });
        console.error("Erro ao deletar esculacho:", err);
      } finally {
        setIsDialogOpen(false);
      }
    });
  };

  if (error) {
    return (
      <p className="text-center text-destructive py-8">
        Erro ao carregar esculachos: {(error as Error).message}
      </p>
    );
  }

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Deletar Esculacho</h2>

      <div className="mb-4">
        <Label htmlFor="searchTermEsculachoDel">Buscar Esculacho</Label>
        <Input
          id="searchTermEsculachoDel"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite título, ID ou autor"
          className="mt-1"
        />
      </div>

      <div className="rounded-md border mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Título</TableHead>
              <TableHead className="w-[150px]">Autor</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={`skeleton-row-${i}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-4/5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-3/5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : currentItems && currentItems.length > 0 ? (
              currentItems.map((item: Esculacho) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titulo}</TableCell>
                  <TableCell>{item.autor || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.id}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedEsculacho(item); // Atualizado
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
                  colSpan={4}
                  className="text-center py-4 text-muted-foreground"
                >
                  Nenhum esculacho encontrado.
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
              Tem certeza que deseja deletar o esculacho "
              <strong>{selectedEsculacho?.titulo}</strong>" (ID:{" "}
              {selectedEsculacho?.id})? Esta ação não pode ser desfeita.
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
