"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EsculachoSchema, EsculachoFormData } from "@/lib/types"; // Atualizado
import { addEsculacho } from "@/actions/esculachoActions"; // Atualizado
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Adicionado para o conteúdo
import { Button } from "@/components/ui/button";
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

export default function AddEsculachoForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<EsculachoFormData>({
    resolver: zodResolver(EsculachoSchema),
    defaultValues: {
      titulo: "",
      descricao: "", // Agora obrigatório, string vazia como inicial
      conteudo: "",
      autor: "", // Agora obrigatório, string vazia como inicial
    },
  });

  const onSubmit = async (data: EsculachoFormData) => {
    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("titulo", data.titulo);
      formDataToSubmit.append("conteudo", data.conteudo);
      formDataToSubmit.append("descricao", data.descricao); // Sempre adiciona, pois é obrigatório
      formDataToSubmit.append("autor", data.autor); // Sempre adiciona, pois é obrigatório

      const result = await addEsculacho(formDataToSubmit);
      if (result.success) {
        toast.success(result.message || "Esculacho adicionado com sucesso!");
        form.reset();
      } else {
        toast.error(result.message || "Erro ao adicionar esculacho.", {
          description: result.errors
            ?.map((err) => `${err.field}: ${err.message}`)
            .join("\n"),
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 p-4 border rounded-md mt-4"
      >
        <h2 className="text-xl font-semibold mb-4">Adicionar Novo Esculacho</h2>
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Esculacho</FormLabel>
              <FormControl>
                <Input placeholder="Título do esculacho" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conteudo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo do Esculacho</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o esculacho aqui..."
                  {...field}
                  rows={5} // Ajuste conforme necessário
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Descrição breve ou subtítulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="autor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Autor</FormLabel>
              <FormControl>
                <Input placeholder="Nome do autor ou fonte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...
            </>
          ) : (
            "Adicionar Esculacho"
          )}
        </Button>
      </form>
    </Form>
  );
}
