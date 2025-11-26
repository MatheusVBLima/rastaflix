"use client";

import React, { useState } from "react";
import { deleteSeason } from "@/actions/awardActions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllSeasons } from "@/lib/queries";
import { AwardSeason } from "@/lib/types";
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

export function DeleteSeasonForm() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({
    queryKey: ["seasons"],
    queryFn: fetchAllSeasons,
  });

  async function handleDelete() {
    if (!selectedId) return;
    setIsDeleting(true);
    const result = await deleteSeason(selectedId);
    if (result.success) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    } else {
      toast.error(result.message);
    }
    setIsDeleting(false);
    setSelectedId(null);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Deletar Temporada</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ano</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seasons.map((season) => (
            <TableRow key={season.id}>
              <TableCell>{season.year}</TableCell>
              <TableCell>{season.title}</TableCell>
              <TableCell>
                <Badge variant={season.status === "active" ? "default" : "secondary"}>
                  {season.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setSelectedId(season.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!selectedId} onOpenChange={(open) => !isDeleting && !open && setSelectedId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta temporada? Esta ação não pode ser desfeita.
              Todas as categorias, nominados e votos associados também serão deletados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
