"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MusicSchema, ActionResponse } from "@/lib/types";
import { addMusic } from "@/actions/musicActions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormState } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Esquema Zod para o formulário do cliente
const FormSchema = MusicSchema;

type FormValues = z.infer<typeof FormSchema>;

export function AddMusicForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Para feedback visual enquanto verifica preview
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  // Estado inicial da action
  const initialState: ActionResponse = { 
    success: false, 
    message: ""
  };

  // Criar formAction para useFormState
  const formAction = async (prevState: ActionResponse, formData: FormData) => {
    return await addMusic(formData);
  };

  // Estado do formulário e formAction vinculada para gerenciar submissões
  const [state, formAction2] = useFormState(formAction, initialState);

  // Configurar formulário com validação Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      url: "",
      imageUrl: "",
    },
    mode: "onChange",
  });

  // Efeito para reagir às mudanças de estado do formulário
  useEffect(() => {
    if (state.success) {
      // Mostrar toast de sucesso
      toast.success("Música adicionada com sucesso!", {
        description: state.message,
        position: "bottom-right",
      });
      
      // Limpar form
      form.reset();
      setPreviewMessage(null);
      
      // Revalidar dados
      router.refresh();
      queryClient.resetQueries({ queryKey: ['musicas'] });
    } else if (state?.message && !state.success) {
      // Mostrar toast de erro
      toast.error("Erro ao adicionar música", {
        description: state.message,
        position: "bottom-right",
      });
      
      // Se houver erros de validação, mostrar cada erro em um toast
      if (state.errors) {
        state.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`, {
            position: "bottom-right",
          });
        });
      }
    }
  }, [state, form, router, queryClient]);

  const onSubmit = useCallback((values: FormValues) => {
    startTransition(() => {
      // FormData é esperado pela server action
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("url", values.url);

      if (typeof values.imageUrl === 'string') {
        formData.append("imageUrl", values.imageUrl);
      }
      
      formAction2(formData);
    });
  }, [formAction2]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-md mt-4">
        <h2 className="text-xl font-semibold mb-4">Adicionar Nova Música</h2>
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Música</FormLabel>
              <FormControl>
                <Input placeholder="Nome da música" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Música</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://exemplo.com/musica" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem (Opcional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://exemplo.com/imagem.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adicionando..." : "Adicionar Música"}
        </Button>
      </form>
    </Form>
  );
} 