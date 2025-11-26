"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditAwardCategorySchema, AwardCategory, AwardSeason } from "@/lib/types";
import { editCategory } from "@/actions/awardActions";
import { fetchCategoryById, fetchAllSeasons, fetchCategoriesBySeason } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, PencilIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function EditCategoryForm() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({ queryKey: ["seasons"], queryFn: fetchAllSeasons });
  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: ["categories", selectedSeasonId],
    queryFn: () => selectedSeasonId ? fetchCategoriesBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  const form = useForm({
    resolver: zodResolver(EditAwardCategorySchema),
    defaultValues: { id: "", season_id: "", name: "", description: "", display_order: 0 },
  });

  async function handleLoad(id: string) {
    setSelectedId(id);
    const category = await fetchCategoryById(id);
    if (category) {
      form.reset({ id: category.id, season_id: category.season_id, name: category.name, description: category.description || "", display_order: category.display_order });
    }
  }

  async function onSubmit(data: any) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("season_id", data.season_id);
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      formData.append("display_order", data.display_order.toString());

      const result = await editCategory(formData);
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        form.reset();
        setSelectedId("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Editar Categoria</h2>

      <div className="mb-4">
        <Select onValueChange={setSelectedSeasonId} value={selectedSeasonId}>
          <SelectTrigger><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
          <SelectContent>
            {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} ({s.year})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedSeasonId && (
        <Table className="mb-6">
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Ordem</TableHead><TableHead>Ação</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.display_order}</TableCell>
                <TableCell><Button size="sm" onClick={() => handleLoad(cat.id)}><PencilIcon className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedId && (
        <div className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="season_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="display_order" render={({ field }) => (
                <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
