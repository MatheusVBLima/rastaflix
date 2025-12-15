"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClipe } from "@/actions/clipesActions";
import { fetchClipes } from "@/lib/queries";
import type { Clipe } from "@/lib/types";
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

export function DeleteClipeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClipe, setSelectedClipe] = useState<Clipe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  const {
    data: clipes,
    isLoading,
    error,
  } = useQuery<Clipe[]>({
    queryKey: ["clipes"],
    queryFn: fetchClipes,
    staleTime: Infinity,
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredClipes = clipes?.filter(
    (clipe) =>
      clipe.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clipe.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredClipes?.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = filteredClipes ? Math.ceil(filteredClipes.length / itemsPerPage) : 0;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case "twitch":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "kick":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "youtube":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "";
    }
  };

  const handleDelete = async () => {
    if (!selectedClipe) return;

    startTransition(async () => {
      try {
        const result = await deleteClipe(selectedClipe.id);
        if (result.success) {
          toast.success("Clipe deletado com sucesso!", {
            description: `O clipe "${selectedClipe.titulo}" foi removido.`,
          });
          router.refresh();
          await queryClient.invalidateQueries({ queryKey: ["clipes"] });
          setSelectedClipe(null);
        } else {
          toast.error("Falha ao deletar clipe", { description: result.message });
        }
      } catch (error) {
        toast.error("Erro inesperado", {
          description: "Ocorreu um erro ao tentar deletar o clipe",
        });
        console.error("Erro ao deletar clipe:", error);
      } finally {
        setIsDialogOpen(false);
      }
    });
  };

  if (error) {
    return (
      <p className="text-center text-destructive py-8">
        Erro ao carregar clipes: {(error as Error).message}
      </p>
    );
  }

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Deletar Clipe</h2>

      <div className="mb-4">
        <Label htmlFor="searchTerm">Buscar clipe</Label>
        <Input
          id="searchTerm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite o titulo ou ID do clipe"
          className="mt-1"
        />
      </div>

      <div className="rounded-md border mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={`skeleton-row-${i}`}>
                    <TableCell><Skeleton className="h-5 w-4/5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </>
            ) : currentItems && currentItems.length > 0 ? (
              currentItems.map((clipe: Clipe) => (
                <TableRow key={clipe.id}>
                  <TableCell className="font-medium">{clipe.titulo}</TableCell>
                  <TableCell>
                    <Badge className={getPlatformBadgeColor(clipe.plataforma)}>
                      {clipe.plataforma}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedClipe(clipe);
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
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  Nenhum clipe encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Delecao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o clipe "<strong>{selectedClipe?.titulo}</strong>"?
              Esta acao nao pode ser desfeita.
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
