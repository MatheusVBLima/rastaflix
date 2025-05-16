"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MusicSchema, MusicFormData } from "@/lib/types";
import { addMusic } from "@/actions/musicActions";
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
    if (currentUrlValue && currentUrlValue.startsWith("http")) {
      const timer = setTimeout(() => {
        setIsFetchingPreview(true);
        setPreviewError(null);
        form.setValue("imageUrl", ""); // Limpa a imagem antiga enquanto busca uma nova

        try {
          const urlObj = new URL(currentUrlValue);

          // Verificar se é uma URL do YouTube
          if (
            urlObj.hostname.includes("youtube.com") ||
            urlObj.hostname.includes("youtu.be")
          ) {
            // Extrair videoId para URLs padrão do YouTube
            let videoId = urlObj.searchParams.get("v");

            // Formato youtu.be/ID
            if (!videoId && urlObj.hostname.includes("youtu.be")) {
              videoId = urlObj.pathname.substring(1);
            }

            if (videoId) {
              // Construir URL da thumbnail diretamente
              const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
              // Definir a URL da thumbnail no formulário
              form.setValue("imageUrl", thumbnailUrl, { shouldValidate: true });
              setIsFetchingPreview(false);
              return;
            }
          }

          // Não é YouTube ou não conseguiu extrair videoId
          setPreviewError(
            "URL não é do YouTube ou não foi possível extrair a thumbnail."
          );
          // Definir uma imagem padrão
          form.setValue(
            "imageUrl",
            "https://via.placeholder.com/1200x630?text=Preview+Indisponível",
            { shouldValidate: true }
          );
        } catch (error) {
          console.error("[AddMusicForm] Erro ao analisar URL:", error);
          setPreviewError("Erro ao processar URL.");
          // Fallback para qualquer erro
          form.setValue(
            "imageUrl",
            "https://via.placeholder.com/1200x630?text=Preview+Indisponível",
            { shouldValidate: true }
          );
        }

        setIsFetchingPreview(false);
      }, 800);

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

        {/* Campo da URL da Imagem - Agora oculto para o usuário, preenchido automaticamente */}
        <input type="hidden" {...form.register("imageUrl")} />

        {isFetchingPreview && (
          <p className="text-sm text-muted-foreground">Buscando preview...</p>
        )}
        {previewError && (
          <p className="text-sm text-red-500 mt-1">{previewError}</p>
        )}
        {currentImageUrlValue && !isFetchingPreview && !previewError && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">Preview da Imagem:</p>
            <img
              src={currentImageUrlValue}
              alt="Preview da música"
              className="rounded-md border max-h-40 w-auto"
            />
          </div>
        )}

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
