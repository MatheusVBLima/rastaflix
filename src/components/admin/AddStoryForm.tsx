"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StorySchema as ServerStorySchema, ActionResponse } from "@/lib/types";
import { addStory } from "@/actions/storyActions";
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
import { getOpenGraphData } from "@/actions/openGraphActions";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Esquema Zod para o formulário do cliente
// Tags será uma string no formulário, mas um array de strings no schema do servidor
const FormSchema = ServerStorySchema.extend({
  tags: z.string().optional(), // Tags é uma string opcional no formulário, a transformação para array é feita na server action.
});

type FormValues = z.infer<typeof FormSchema>;

export function AddStoryForm() {
  const [isPending, startTransition] = useTransition();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Adaptando para useFormState
  const initialState: ActionResponse = { success: false, message: "" };
  const [state, formAction] = useFormState(addStory, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "", // No formulário, tags é uma string
      url: "",
      imageUrl: "",
    },
  });

  const storyUrl = form.watch("url"); // Observar o campo URL

  // Mantemos esse useEffect apenas para o debounce da preview da URL
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (
        storyUrl &&
        storyUrl.startsWith("http") &&
        !form.getValues("imageUrl")
      ) {
        setIsFetchingPreview(true);
        setPreviewMessage("Buscando imagem de preview...");
        startTransition(async () => {
          const ogData = await getOpenGraphData(storyUrl);

          if (ogData.success) {
            // A chamada para getOpenGraphData foi bem-sucedida (página acessada)
            if (ogData.imageUrl) {
              // Encontrou uma og:image
              form.setValue("imageUrl", ogData.imageUrl, {
                shouldValidate: true,
              });
              setPreviewMessage("Imagem de preview carregada!");
            } else {
              // Não encontrou og:image, mas a chamada foi ok. Hora do fallback para YouTube.
              console.log(
                "[AddStoryForm] og:image não encontrada (ou null). Tentando fallback para YouTube. storyUrl:",
                storyUrl
              );
              try {
                const urlObj = new URL(storyUrl);
                console.log(
                  "[AddStoryForm] urlObj.hostname para fallback:",
                  urlObj.hostname
                );

                if (
                  urlObj.hostname.includes("youtube.com") ||
                  urlObj.hostname.includes("youtu.be")
                ) {
                  let videoId = urlObj.searchParams.get("v");
                  if (!videoId && urlObj.hostname.includes("youtu.be")) {
                    videoId = urlObj.pathname.substring(1);
                  }

                  if (videoId) {
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    form.setValue("imageUrl", thumbnailUrl, {
                      shouldValidate: true,
                    });
                    setPreviewMessage(
                      "Thumbnail do YouTube carregada como preview."
                    );
                  } else {
                    console.log(
                      "[AddStoryForm] Não foi possível extrair videoId do YouTube."
                    );
                    setPreviewMessage(
                      ogData.message ||
                        "Não foi possível extrair o ID do vídeo do YouTube para a thumbnail."
                    );
                  }
                } else {
                  console.log(
                    "[AddStoryForm] URL não é do YouTube, usando mensagem de ogData."
                  );
                  setPreviewMessage(
                    ogData.message ||
                      "Nenhuma imagem de preview encontrada e não é uma URL do YouTube."
                  );
                }
              } catch (e: any) {
                console.error(
                  "[AddStoryForm] Erro no bloco de fallback do YouTube:",
                  e
                );
                setPreviewMessage(
                  ogData.message ||
                    "Ocorreu um erro ao tentar obter a thumbnail do YouTube."
                );
              }
            }
          } else {
            // A chamada para getOpenGraphData falhou (e.g., URL inacessível, erro no servidor)
            console.log(
              "[AddStoryForm] getOpenGraphData falhou. ogData:",
              ogData
            );
            setPreviewMessage(
              ogData.message ||
                ogData.error ||
                "Não foi possível carregar a imagem de preview."
            );
          }
          setIsFetchingPreview(false);
        });
      } else if (!storyUrl.startsWith("http") && storyUrl !== "") {
        setPreviewMessage("URL inválida para buscar preview.");
      } else {
        setPreviewMessage(null); // Limpa a mensagem se a URL for limpa ou se a imagem já estiver preenchida
      }
    }, 1000); // Atraso de 1 segundo

    return () => {
      clearTimeout(handler);
    };
  }, [storyUrl, form]); // Executar quando storyUrl ou form mudarem

  // Efeito para reagir às mudanças de estado do formulário
  useEffect(() => {
    if (state.success) {
      // Mostrar toast de sucesso
      toast.success("História adicionada com sucesso!", {
        description: state.message,
        position: "bottom-right",
      });

      // Limpar form
      form.reset();
      setPreviewMessage(null);

      // Revalidar dados
      router.refresh();
      queryClient.resetQueries({ queryKey: ["historias"] });
    } else if (state?.message && !state.success) {
      // Mostrar toast de erro
      toast.error("Erro ao adicionar história", {
        description: state.message,
        position: "bottom-right",
      });

      // Se houver erros de validação, mostrar cada erro em um toast
      if (state.errors) {
        state.errors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`, {
            position: "bottom-right",
          });
        });
      }
    }
  }, [state, form, router, queryClient]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      startTransition(() => {
        // FormData é esperado pela server action
        const formData = new FormData();
        formData.append("title", values.title);
        if (values.description)
          formData.append("description", values.description);

        // values.tags já é uma string (ou undefined) devido ao FormSchema cliente.
        if (values.tags) {
          formData.append("tags", values.tags);
        }

        formData.append("url", values.url);

        if (typeof values.imageUrl === "string") {
          formData.append("imageUrl", values.imageUrl);
        }

        formAction(formData);
      });
    },
    [formAction]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 p-4 border rounded-md mt-4"
      >
        <h2 className="text-xl font-semibold mb-4">Adicionar Nova História</h2>

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
                <Textarea
                  placeholder="Uma breve descrição da história"
                  {...field}
                />
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
                {/* No Zod schema, field.value será array após transformação.
                    Mas o Input espera string.
                    Então usamos form.setValue para atualizar o form state,
                    e o valor para o input é pego diretamente do estado do react-hook-form
                    ou asseguramos que o 'field' seja tratado como string para o input.
                    Aqui, como 'tags' em FormValues é string, field.value deve ser string.
                    Se StorySchema.tags fosse z.string(), seria mais direto.
                    A transformação acontece no Zod. A action espera a string.
                */}
                <Input
                  placeholder="js, react, nextjs (separadas por vírgula)"
                  {...field}
                  // Assegura que o valor passado para o input seja uma string.
                  // O `field` para `tags` (que é `string().optional()` no FormSchema antes da transformação)
                  // deve ser uma string.
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
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
                <Input
                  type="url"
                  placeholder="https://exemplo.com/historia"
                  {...field}
                />
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
                <Input
                  type="url"
                  placeholder="https://exemplo.com/imagem.png"
                  {...field}
                  disabled={isFetchingPreview}
                />
              </FormControl>
              {isFetchingPreview && (
                <FormDescription>Buscando preview...</FormDescription>
              )}
              {previewMessage && (
                <FormDescription
                  className={
                    previewMessage.startsWith("Imagem de preview carregada!")
                      ? "text-green-500"
                      : "text-gray-500"
                  }
                >
                  {previewMessage}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adicionando..." : "Adicionar História"}
        </Button>
      </form>
    </Form>
  );
}
