"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MusicSchema, MusicFormData } from "@/lib/types";
import { addMusic } from "@/actions/musicActions";
import { getOpenGraphData } from "@/actions/openGraphActions";
import { Input } from "@/components/ui/input";
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

export default function AddMusicForm() {
  const [isPending, startTransition] = useTransition();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const form = useForm<MusicFormData>({
    resolver: zodResolver(MusicSchema),
    defaultValues: {
      title: "",
      url: "",
      imageUrl: "",
    },
  });

  const currentUrlValue = form.watch("url");
  const currentImageUrlValue = form.watch("imageUrl");

  // Efeito para buscar preview da URL
  useEffect(() => {
    if (
      currentUrlValue &&
      (currentUrlValue.startsWith("https://www.youtube.com") ||
        currentUrlValue.startsWith("https://youtu.be"))
    ) {
      const timer = setTimeout(async () => {
        setIsFetchingPreview(true);
        setPreviewError(null);
        form.setValue("imageUrl", ""); // Limpa a imagem antiga enquanto busca uma nova
        try {
          const ogData = await getOpenGraphData(currentUrlValue);
          if (ogData.success && ogData.imageUrl) {
            form.setValue("imageUrl", ogData.imageUrl, {
              shouldValidate: true,
            });
          } else {
            setPreviewError(
              ogData.message || "Não foi possível buscar a imagem de preview."
            );
          }
        } catch (error) {
          setPreviewError("Erro ao buscar preview da imagem.");
        }
        setIsFetchingPreview(false);
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timer);
    }
  }, [currentUrlValue, form]);

  const onSubmit = async (data: MusicFormData) => {
    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("title", data.title);
      formDataToSubmit.append("url", data.url);
      formDataToSubmit.append("imageUrl", data.imageUrl || "");

      const result = await addMusic(formDataToSubmit);
      if (result.success) {
        toast.success(result.message || "Música adicionada com sucesso!");
        form.reset(); // Limpa o formulário
        setPreviewError(null);
      } else {
        toast.error(result.message || "Erro ao adicionar música.", {
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
              <FormLabel>URL da Música (YouTube)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
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
                  placeholder="Será preenchido automaticamente se for link do YouTube"
                  {...field}
                  value={field.value || ""}
                  disabled={isFetchingPreview}
                />
              </FormControl>

              {previewError && (
                <p className="text-sm text-red-500 mt-1">{previewError}</p>
              )}
              <FormMessage />
              {currentImageUrlValue && !isFetchingPreview && !previewError && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Preview da Imagem:
                  </p>
                  <img
                    src={currentImageUrlValue}
                    alt="Preview da música"
                    className="rounded-md border max-h-40 w-auto"
                  />
                </div>
              )}
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending || isFetchingPreview}>
          {isPending || isFetchingPreview ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {isFetchingPreview ? "Buscando Imagem..." : "Adicionando..."}
            </>
          ) : (
            "Adicionar Música"
          )}
        </Button>
      </form>
    </Form>
  );
}
