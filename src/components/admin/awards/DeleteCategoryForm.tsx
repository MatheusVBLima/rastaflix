"use client";

import React, { useState } from "react";
import { deleteCategory } from "@/actions/awardActions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllSeasons, fetchCategoriesBySeason } from "@/lib/queries";
import { AwardSeason, AwardCategory } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function DeleteCategoryForm() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({ queryKey: ["seasons"], queryFn: fetchAllSeasons });
  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: ["categories", selectedSeasonId],
    queryFn: () => selectedSeasonId ? fetchCategoriesBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  async function handleDelete() {
    if (!selectedId) return;
    setIsDeleting(true);
    const result = await deleteCategory(selectedId);
    if (result.success) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } else {
      toast.error(result.message);
    }
    setIsDeleting(false);
    setSelectedId(null);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Deletar Categoria</h2>
      <div className="mb-4">
        <Select onValueChange={setSelectedSeasonId} value={selectedSeasonId}>
          <SelectTrigger><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
          <SelectContent>
            {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} ({s.year})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedSeasonId && (
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell><Button size="sm" variant="destructive" onClick={() => setSelectedId(cat.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!selectedId} onOpenChange={(open) => !isDeleting && !open && setSelectedId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deletar esta categoria também deletará todos os nominados e votos associados.</AlertDialogDescription>
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
