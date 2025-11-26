"use client";

import React, { useState } from "react";
import { deleteNominee } from "@/actions/awardActions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllSeasons, fetchCategoriesBySeason, fetchNomineesByCategory } from "@/lib/queries";
import { AwardSeason, AwardCategory, AwardNominee } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function DeleteNomineeForm() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({ queryKey: ["seasons"], queryFn: fetchAllSeasons });
  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: ["categories", selectedSeasonId],
    queryFn: () => selectedSeasonId ? fetchCategoriesBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });
  const { data: nominees = [] } = useQuery<AwardNominee[]>({
    queryKey: ["nominees", selectedCategoryId],
    queryFn: () => selectedCategoryId ? fetchNomineesByCategory(selectedCategoryId) : Promise.resolve([]),
    enabled: !!selectedCategoryId,
  });

  async function handleDelete() {
    if (!selectedId) return;
    setIsDeleting(true);
    const result = await deleteNominee(selectedId);
    if (result.success) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
    } else {
      toast.error(result.message);
    }
    setIsDeleting(false);
    setSelectedId(null);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Deletar Nominado</h2>
      <div className="space-y-4 mb-4">
        <Select onValueChange={setSelectedSeasonId} value={selectedSeasonId}>
          <SelectTrigger><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
          <SelectContent>
            {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} ({s.year})</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedSeasonId && (
          <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId}>
            <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedCategoryId && (
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
          <TableBody>
            {nominees.map((n) => (
              <TableRow key={n.id}>
                <TableCell>{n.title}</TableCell>
                <TableCell><Button size="sm" variant="destructive" onClick={() => setSelectedId(n.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!selectedId} onOpenChange={(open) => !isDeleting && !open && setSelectedId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deletar este nominado também deletará todos os votos associados.</AlertDialogDescription>
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
