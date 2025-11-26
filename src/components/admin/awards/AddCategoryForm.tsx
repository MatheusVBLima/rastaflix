"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AwardCategorySchema, AwardSeason } from "@/lib/types";
import { addCategory } from "@/actions/awardActions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllSeasons } from "@/lib/queries";

type AddCategoryFormData = {
  season_id: string;
  name: string;
  description?: string;
  display_order: number;
};

export function AddCategoryForm() {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({
    queryKey: ["seasons"],
    queryFn: fetchAllSeasons,
  });

  const form = useForm<AddCategoryFormData>({
    resolver: zodResolver(AwardCategorySchema),
    defaultValues: {
      season_id: "",
      name: "",
      description: "",
      display_order: 0,
    },
  });

  async function onSubmit(data: AddCategoryFormData) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("season_id", data.season_id);
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      formData.append("display_order", data.display_order.toString());

      const result = await addCategory(formData);

      if (result.success) {
        toast.success(result.message);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Adicionar Categoria</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="season_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Temporada</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.title} ({season.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl><Input placeholder="Melhor Música" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="display_order" render={({ field }) => (
            <FormItem>
              <FormLabel>Ordem de Exibição</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar Categoria
          </Button>
        </form>
      </Form>
    </div>
  );
}
