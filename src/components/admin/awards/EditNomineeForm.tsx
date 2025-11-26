"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditAwardNomineeSchema, AwardSeason, AwardCategory, AwardNominee } from "@/lib/types";
import { editNominee } from "@/actions/awardActions";
import { fetchAllSeasons, fetchCategoriesBySeason, fetchNomineesByCategory, fetchNomineeById } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, PencilIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function EditNomineeForm() {
  const [selectedId, setSelectedId] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isPending, startTransition] = useTransition();
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

  const form = useForm({
    resolver: zodResolver(EditAwardNomineeSchema),
    defaultValues: { id: "", category_id: "", title: "", description: "", image_url: "", content_link: "", display_order: 0 },
  });

  async function handleLoad(id: string) {
    setSelectedId(id);
    const nominee = await fetchNomineeById(id);
    if (nominee) {
      form.reset({ id: nominee.id, category_id: nominee.category_id, title: nominee.title, description: nominee.description || "", image_url: nominee.image_url || "", content_link: nominee.content_link || "", display_order: nominee.display_order });
    }
  }

  async function onSubmit(data: any) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("category_id", data.category_id);
      formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      if (data.image_url) formData.append("image_url", data.image_url);
      if (data.content_link) formData.append("content_link", data.content_link);
      formData.append("display_order", data.display_order.toString());

      const result = await editNominee(formData);
      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["nominees"] });
        form.reset();
        setSelectedId("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Editar Nominado</h2>
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
        <Table className="mb-6">
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
          <TableBody>
            {nominees.map((n) => (
              <TableRow key={n.id}>
                <TableCell>{n.title}</TableCell>
                <TableCell><Button size="sm" onClick={() => handleLoad(n.id)}><PencilIcon className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedId && (
        <div className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="category_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="image_url" render={({ field }) => (
                <FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="content_link" render={({ field }) => (
                <FormItem><FormLabel>Link do Conteúdo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
