"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditAwardSeasonSchema, AwardSeason } from "@/lib/types";
import { editSeason } from "@/actions/awardActions";
import { fetchSeasonById } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, PencilIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllSeasons } from "@/lib/queries";

type EditSeasonFormData = {
  id: string;
  year: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "closed";
};

export function EditSeasonForm() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery<AwardSeason[]>({
    queryKey: ["seasons"],
    queryFn: fetchAllSeasons,
  });

  const form = useForm<EditSeasonFormData>({
    resolver: zodResolver(EditAwardSeasonSchema),
    defaultValues: {
      id: "",
      year: new Date().getFullYear(),
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "draft",
    },
  });

  async function handleLoadSeason(id: string) {
    setSelectedSeasonId(id);
    setIsLoading(true);
    const season = await fetchSeasonById(id);
    if (season) {
      form.reset({
        id: season.id,
        year: season.year,
        title: season.title,
        description: season.description || "",
        start_date: season.start_date.slice(0, 16),
        end_date: season.end_date.slice(0, 16),
        status: season.status,
      });
    }
    setIsLoading(false);
  }

  async function onSubmit(data: EditSeasonFormData) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", data.id);
      formData.append("year", data.year.toString());
      formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      formData.append("start_date", data.start_date);
      formData.append("end_date", data.end_date);
      formData.append("status", data.status);

      const result = await editSeason(formData);

      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["seasons"] });
        form.reset();
        setSelectedSeasonId("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Editar Temporada</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Selecionar Temporada</h3>
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
                  <Button size="sm" onClick={() => handleLoadSeason(season.id)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedSeasonId && (
        <div className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Término</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="closed">Encerrada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
