"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipeSchema, ClipeFormData } from "@/lib/types";
import { addClipe } from "@/actions/clipesActions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AddClipeForm() {
  const [isPending, startTransition] = useTransition();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ClipeFormData>({
    resolver: zodResolver(ClipeSchema),
    defaultValues: {
      titulo: "",
      url: "",
      thumbnail_url: "",
      plataforma: "twitch",
    },
  });

  const currentUrlValue = form.watch("url");
  const currentThumbnailUrl = form.watch("thumbnail_url");
  const currentPlatform = form.watch("plataforma");

  // Efeito para extrair thumbnail da URL
  useEffect(() => {
    if (currentUrlValue && currentUrlValue.startsWith("http")) {
      const timer = setTimeout(() => {
        setIsFetchingPreview(true);
        setPreviewError(null);
        form.setValue("thumbnail_url", "");

        try {
          const urlObj = new URL(currentUrlValue);

          // Twitch Clips
          if (urlObj.hostname.includes("twitch.tv") && urlObj.pathname.includes("/clip/")) {
            // Para clipes da Twitch, a thumbnail precisa ser buscada via API
            // Por agora, deixamos vazio para preenchimento manual
            setPreviewError("Clipes da Twitch: thumbnail precisa ser adicionada manualmente.");
            if (currentPlatform !== "twitch") {
              form.setValue("plataforma", "twitch");
            }
            setIsFetchingPreview(false);
            return;
          }

          // Twitch clips.twitch.tv format
          if (urlObj.hostname.includes("clips.twitch.tv")) {
            setPreviewError("Clipes da Twitch: thumbnail precisa ser adicionada manualmente.");
            if (currentPlatform !== "twitch") {
              form.setValue("plataforma", "twitch");
            }
            setIsFetchingPreview(false);
            return;
          }

          // Kick
          if (urlObj.hostname.includes("kick.com")) {
            setPreviewError("Clipes da Kick: thumbnail precisa ser adicionada manualmente.");
            if (currentPlatform !== "kick") {
              form.setValue("plataforma", "kick");
            }
            setIsFetchingPreview(false);
            return;
          }

          // URL não reconhecida
          setPreviewError("URL não reconhecida. Adicione a thumbnail manualmente se desejar.");
        } catch (error) {
          console.error("[AddClipeForm] Erro ao analisar URL:", error);
          setPreviewError("Erro ao processar URL.");
        }

        setIsFetchingPreview(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [currentUrlValue, form, currentPlatform]);

  const onSubmit = async (data: ClipeFormData) => {
    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("titulo", data.titulo);
      formDataToSubmit.append("url", data.url);
      formDataToSubmit.append("thumbnail_url", data.thumbnail_url || "");
      formDataToSubmit.append("plataforma", data.plataforma);

      const result = await addClipe(formDataToSubmit);
      if (result.success) {
        toast.success(result.message || "Clipe adicionado com sucesso!");
        form.reset();
        setPreviewError(null);
        queryClient.invalidateQueries({ queryKey: ["clipes"] });
      } else {
        toast.error(result.message || "Erro ao adicionar clipe.", {
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
        <h2 className="text-xl font-semibold mb-4">Adicionar Novo Clipe</h2>

        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titulo do Clipe</FormLabel>
              <FormControl>
                <Input placeholder="Titulo do clipe" {...field} />
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
              <FormLabel>URL do Clipe</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://clips.twitch.tv/... ou https://kick.com/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plataforma"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plataforma</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="twitch">Twitch</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Thumbnail (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://... (adicione manualmente)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isFetchingPreview && (
          <p className="text-sm text-muted-foreground">Buscando preview...</p>
        )}
        {previewError && (
          <p className="text-sm text-yellow-500 mt-1">{previewError}</p>
        )}
        {currentThumbnailUrl && !isFetchingPreview && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">Preview da Thumbnail:</p>
            <img
              src={currentThumbnailUrl}
              alt="Preview do clipe"
              className="rounded-md border max-h-40 w-auto"
            />
          </div>
        )}

        <Button type="submit" disabled={isPending || isFetchingPreview}>
          {isPending || isFetchingPreview ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
              {isFetchingPreview ? "Processando..." : "Adicionando..."}
            </>
          ) : (
            "Adicionar Clipe"
          )}
        </Button>
      </form>
    </Form>
  );
}
