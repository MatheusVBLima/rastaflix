"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AwardNomineeSchema, AwardSeason, AwardCategory } from "@/lib/types";
import { addNominee } from "@/actions/awardActions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllSeasons, fetchCategoriesBySeason } from "@/lib/queries";

export function AddNomineeForm() {
  const [isPending, startTransition] = useTransition();
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({ queryKey: ["seasons"], queryFn: fetchAllSeasons });
  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: ["categories", selectedSeasonId],
    queryFn: () => selectedSeasonId ? fetchCategoriesBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  const form = useForm({
    resolver: zodResolver(AwardNomineeSchema),
    defaultValues: { category_id: "", title: "", description: "", image_url: "", content_link: "", display_order: 0 },
  });

  async function onSubmit(data: any) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("category_id", data.category_id);
      formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      if (data.image_url) formData.append("image_url", data.image_url);
      if (data.content_link) formData.append("content_link", data.content_link);
      formData.append("display_order", data.display_order.toString());

      const result = await addNominee(formData);
      if (result.success) {
        toast.success(result.message);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["nominees"] });
        queryClient.invalidateQueries({ queryKey: ["votingData", selectedSeasonId] });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Adicionar Nominado</h2>
      <div className="mb-4">
        <Select onValueChange={setSelectedSeasonId} value={selectedSeasonId}>
          <SelectTrigger><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
          <SelectContent>
            {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.title} ({s.year})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="category_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl>
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
            <FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="image_url" render={({ field }) => (
            <FormItem><FormLabel>URL da Imagem (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="content_link" render={({ field }) => (
            <FormItem><FormLabel>Link do Conteúdo (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="display_order" render={({ field }) => (
            <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar Nominado
          </Button>
        </form>
      </Form>
    </div>
  );
}
