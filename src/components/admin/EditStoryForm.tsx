"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { editStory, getStoryById } from "@/actions/storiesActions";
import type { Story, ActionResponse } from "@/lib/types";
import { EditStorySchema as ServerEditStorySchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormState } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// O EditStorySchema já inclui 'id'. Para o formulário, tags será uma string.
const FormSchema = ServerEditStorySchema.extend({
  tags: z.string().optional(), 
});

type FormValues = z.infer<typeof FormSchema>;

interface EditStoryFormProps {
  // No futuro, poderíamos passar uma lista de histórias para um select
  // ou integrar com uma lista clicável.
  // Por enquanto, um input para ID para buscar a história.
}

export function EditStoryForm({}: EditStoryFormProps) {
  const [storyIdToEdit, setStoryIdToEdit] = useState<string>("");
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [isEditPending, startEditTransition] = useTransition();
  const editInitialState: ActionResponse = { success: false, message: "" };
  const [editState, editFormAction] = useFormState(editStory, editInitialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: "", // ID será preenchido ao carregar a história
      title: "",
      description: "",
      tags: "",
      url: "",
      imageUrl: "",
    },
  });

  const handleLoadStory = useCallback(async () => {
    if (!storyIdToEdit) {
      setLoadError("Por favor, insira um ID de história para carregar.");
      toast.error("Erro", {
        description: "Por favor, insira um ID de história para carregar.",
        position: "top-center",
      });
      form.reset(); // Limpa o formulário se o ID for removido
      return;
    }
    setIsLoadingStory(true);
    setLoadError(null);
    form.reset(); // Limpa antes de carregar novos dados

    startEditTransition(async () => {
      const result = await getStoryById(storyIdToEdit);
      setIsLoadingStory(false);
      if (result.story) {
        form.reset({
          id: result.story.id,
          title: result.story.title,
          description: result.story.description || "",
          tags: result.story.tags?.join(", ") || "", // Converter array para string
          url: result.story.url,
          imageUrl: result.story.imageUrl || "",
        });
      } else {
        const errorMsg = result.error || "Falha ao carregar história.";
        setLoadError(errorMsg);
        toast.error("Erro ao carregar história", {
          description: errorMsg,
          position: "top-center",
        });
      }
    });
  }, [storyIdToEdit, form]);

  useEffect(() => {
    if (editState.success) {
      // Mostrar toast de sucesso
      toast.success("História atualizada com sucesso!", {
        description: editState.message,
        position: "top-center",
      });
      
      // Revalidar dados
      router.refresh();
      queryClient.resetQueries({ queryKey: ['historias'] });
      queryClient.resetQueries({ queryKey: ['story', storyIdToEdit] });
    } else if (editState?.message && !editState.success) {
      // Mostrar toast de erro se houver mensagem e não for sucesso
      toast.error("Erro ao editar história", {
        description: editState.message,
        position: "top-center",
      });
      
      // Se houver erros de validação, mostrar cada erro em um toast separado
      if (editState?.errors) {
        editState.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`, {
            position: "top-center",
          });
        });
      }
    }
  }, [editState, router, queryClient, storyIdToEdit]);

  const onSubmit = useCallback((values: FormValues) => {
    if (!values.id) {
      // Idealmente, isso não deve acontecer se a história foi carregada
      toast.error("Erro", {
        description: "ID da história está faltando. Recarregue a história.",
        position: "top-center",
      });
      return;
    }
    startEditTransition(() => {
      const formData = new FormData();
      formData.append("id", values.id);
      formData.append("title", values.title);
      if (values.description) formData.append("description", values.description);
      if (values.tags) formData.append("tags", values.tags);
      formData.append("url", values.url);
      if (values.imageUrl) formData.append("imageUrl", values.imageUrl);
      
      editFormAction(formData);
    });
  }, [editFormAction]);

  return (
    <div className="space-y-6 p-4 border rounded-md mt-4">
      <h2 className="text-xl font-semibold mb-4">Editar História Existente</h2>
      
      <div className="flex gap-2 items-end">
        <div className="flex-grow">
          <Label htmlFor="storyIdInput">ID da História para Editar</Label>
          <Input 
            id="storyIdInput"
            placeholder="Cole o ID da história aqui"
            value={storyIdToEdit}
            onChange={(e) => setStoryIdToEdit(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={handleLoadStory} disabled={isLoadingStory || isEditPending || !storyIdToEdit}>
          {isLoadingStory ? "Carregando..." : "Carregar História"}
        </Button>
      </div>

      {form.getValues("id") && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => <Input type="hidden" {...field} />} // Campo ID oculto
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da história" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Uma breve descrição da história" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="js, react, nextjs (separadas por vírgula)" {...field} />
                  </FormControl>
                  <FormDescription>Separe as tags por vírgula.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da História</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://exemplo.com/historia" {...field} />
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
            
            <Button type="submit" disabled={isEditPending || isLoadingStory}>
              {isEditPending ? "Salvando Alterações..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

// Será necessário importar Label de seus componentes UI, se não estiver global
// import { Label } from "@/components/ui/label"; 