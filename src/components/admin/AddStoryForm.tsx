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
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Esquema Zod para o formulário do cliente
// title, description e url vêm do ServerStorySchema para manter suas validações base.
// tags é uma string obrigatória no formulário.
// imageUrl é uma string para controle interno do formulário.
const FormSchema = z.object({
  title: ServerStorySchema.shape.title,
  description: ServerStorySchema.shape.description, // Já é .min(1) pelo types.ts
  tags: z.string().min(1, { message: "As tags são obrigatórias" }), // Tags como string obrigatória no formulário
  url: ServerStorySchema.shape.url,
  imageUrl: z.string(),
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
    resolver: zodResolver(FormSchema), // Usando o FormSchema local para o formulário
    defaultValues: {
      title: "",
      description: "",
      tags: "", // tags é uma string
      url: "",
      imageUrl:
        "https://via.placeholder.com/1200x630?text=Preview+Indisponível",
    },
  });

  const storyUrl = form.watch("url");

  // Efeito para buscar preview da URL
  useEffect(() => {
    if (storyUrl && storyUrl.startsWith("http")) {
      const handler = setTimeout(() => {
        setIsFetchingPreview(true);
        setPreviewMessage("Buscando imagem de preview...");

        try {
          const urlObj = new URL(storyUrl);
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
              form.setValue("imageUrl", thumbnailUrl, { shouldValidate: true });
              setPreviewMessage("Thumbnail do YouTube carregada!");
              setIsFetchingPreview(false);
              return;
            }
          }
          const fallbackUrl =
            "https://via.placeholder.com/1200x630?text=Preview+Indisponível";
          form.setValue("imageUrl", fallbackUrl, { shouldValidate: true });
          setPreviewMessage("URL não é do YouTube. Usando imagem padrão.");
        } catch (error) {
          console.error("[AddStoryForm] Erro ao analisar URL:", error);
          const fallbackUrl =
            "https://via.placeholder.com/1200x630?text=Preview+Indisponível";
          form.setValue("imageUrl", fallbackUrl, { shouldValidate: true });
          setPreviewMessage("Erro ao processar URL. Usando imagem padrão.");
        }
        setIsFetchingPreview(false);
      }, 800);
      return () => clearTimeout(handler);
    } else {
      if (!form.getValues("imageUrl")) {
        const defaultImageUrl =
          "https://via.placeholder.com/1200x630?text=Preview+Indisponível";
        form.setValue("imageUrl", defaultImageUrl, { shouldValidate: true });
      }
    }
  }, [storyUrl, form]);

  useEffect(() => {
    if (state.success) {
      toast.success("História adicionada com sucesso!", {
        description: state.message,
        position: "bottom-right",
      });
      form.reset();
      setPreviewMessage(null);
      router.refresh();
      queryClient.resetQueries({ queryKey: ["historias"] });
    } else if (state?.message && !state.success) {
      toast.error("Erro ao adicionar história", {
        description: state.message,
        position: "bottom-right",
      });
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
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("description", values.description);
        // values.tags é uma string aqui, conforme FormSchema local
        formData.append("tags", values.tags);
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
              <FormLabel>
                Título <span className="text-destructive">*</span>
              </FormLabel>
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
              <FormLabel>
                Descrição <span className="text-destructive">*</span>
              </FormLabel>
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
              <FormLabel>
                Tags <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="js, react, nextjs (separadas por vírgula)"
                  {...field} // field.value será string
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
              <FormLabel>
                URL da História <span className="text-destructive">*</span>
              </FormLabel>
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

        <input
          type="hidden"
          {...form.register("imageUrl")}
          defaultValue="https://via.placeholder.com/1200x630?text=Preview+Indisponível"
        />

        {isFetchingPreview && (
          <p className="text-sm text-muted-foreground">Buscando preview...</p>
        )}

        {form.getValues("imageUrl") &&
          !isFetchingPreview &&
          form.getValues("imageUrl") !==
            "https://via.placeholder.com/1200x630?text=Preview+Indisponível" && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                Preview da Imagem:
              </p>
              <img
                src={form.getValues("imageUrl")}
                alt="Preview da história"
                className="rounded-md border max-h-40 w-auto"
              />
            </div>
          )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adicionando..." : "Adicionar História"}
        </Button>
      </form>
    </Form>
  );
}
