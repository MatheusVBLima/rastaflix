"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Inimigo,
  // EditInimigoSchema, // Removido, pois InimigoSchema é usado para o formulário
  InimigoFormData,
  InimigoStatusSchema,
  InimigoSchema, // Garantir que InimigoSchema está importado
} from "@/lib/types";
import {
  getInimigos,
  getInimigoById,
  editInimigo,
} from "@/actions/inimigoActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function EditInimigoForm() {
  const [selectedInimigoId, setSelectedInimigoId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const {
    data: inimigos,
    isLoading: isLoadingInimigos,
    error: errorInimigos,
  } = useQuery<Inimigo[], Error>({
    queryKey: ["inimigos"],
    queryFn: getInimigos,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const form = useForm<InimigoFormData>({
    resolver: zodResolver(InimigoSchema), // Usar InimigoSchema diretamente
    defaultValues: {
      nome: "",
      status: "pendente",
    },
  });

  const handleLoadInimigo = useCallback(
    async (id: string) => {
      if (!id) {
        form.reset({ nome: "", status: "pendente" });
        return;
      }
      const inimigo = await getInimigoById(id);
      if (inimigo) {
        form.reset({
          nome: inimigo.nome,
          status: inimigo.status,
        });
      } else {
        toast.error("Inimigo não encontrado.");
        form.reset({ nome: "", status: "pendente" });
      }
    },
    [form]
  );

  useEffect(() => {
    if (selectedInimigoId) {
      handleLoadInimigo(selectedInimigoId);
    }
  }, [selectedInimigoId, handleLoadInimigo]);

  const onSubmit = async (data: InimigoFormData) => {
    if (!selectedInimigoId) {
      toast.error("Selecione um inimigo para editar.");
      return;
    }
    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("nome", data.nome);
      formDataToSubmit.append("status", data.status);

      const result = await editInimigo(selectedInimigoId, formDataToSubmit);
      if (result.success) {
        toast.success(result.message || "Inimigo atualizado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["inimigos"] });
        setSelectedInimigoId("");
        form.reset({
          nome: "",
          status: "pendente",
        });
      } else {
        toast.error(result.message || "Erro ao atualizar inimigo.", {
          description: result.errors
            // @ts-ignore
            ?.map((err) => `${err.field}: ${err.message}`)
            .join("\n"),
        });
      }
    });
  };

  if (isLoadingInimigos) return <p>Carregando inimigos...</p>;
  if (errorInimigos)
    return <p>Erro ao carregar inimigos: {errorInimigos.message}</p>;

  return (
    <div className="space-y-4 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Editar Inimigo Existente</h2>
      <Select onValueChange={setSelectedInimigoId} value={selectedInimigoId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um inimigo para editar" />
        </SelectTrigger>
        <SelectContent>
          {inimigos && inimigos.length > 0 ? (
            inimigos.map((inimigo) => (
              <SelectItem key={inimigo.id} value={inimigo.id}>
                {inimigo.nome}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-inimigos" disabled>
              Nenhum inimigo encontrado
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {selectedInimigoId && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-4"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Inimigo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do inimigo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Vingança</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value /* defaultValue mudou para value */}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {InimigoStatusSchema.options.map((statusValue) => (
                        <SelectItem key={statusValue} value={statusValue}>
                          {statusValue.charAt(0).toUpperCase() +
                            statusValue.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isPending || !selectedInimigoId}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
