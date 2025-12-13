"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EsculachoSchema, EsculachoFormData } from "@/lib/types";
import { addEsculacho } from "@/actions/esculachoActions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Volume2, RotateCcw } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { useQueryClient } from "@tanstack/react-query";

export default function AddEsculachoForm() {
  const [isPending, startTransition] = useTransition();
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<EsculachoFormData>({
    resolver: zodResolver(EsculachoSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      conteudo: "",
      autor: "",
    },
  });

  const conteudo = form.watch("conteudo");

  const handleGenerateAudio = async () => {
    const conteudoValue = form.getValues("conteudo");
    if (!conteudoValue || conteudoValue.trim().length === 0) {
      toast.error("Preencha o conteúdo antes de gerar o áudio.");
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: conteudoValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar áudio");
      }

      setAudioUrl(data.audioUrl);
      toast.success("Áudio gerado com sucesso! Ouça o preview abaixo.");
    } catch (error) {
      console.error("Erro ao gerar áudio:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar áudio"
      );
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const onSubmit = async (data: EsculachoFormData) => {
    if (!audioUrl) {
      toast.error("Gere o áudio antes de publicar o esculacho.");
      return;
    }

    startTransition(async () => {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("titulo", data.titulo);
      formDataToSubmit.append("conteudo", data.conteudo);
      formDataToSubmit.append("descricao", data.descricao);
      formDataToSubmit.append("autor", data.autor);
      formDataToSubmit.append("audioUrl", audioUrl);

      const result = await addEsculacho(formDataToSubmit);
      if (result.success) {
        toast.success(result.message || "Esculacho adicionado com sucesso!");
        form.reset();
        setAudioUrl(null);
        queryClient.invalidateQueries({ queryKey: ["esculachos"] });
      } else {
        toast.error(result.message || "Erro ao adicionar esculacho.", {
          description: result.errors
            ?.map((err) => `${err.field}: ${err.message}`)
            .join("\n"),
        });
      }
    });
  };

  const audioSrc = audioUrl;

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
                  placeholder="Descreva o esculacho aqui... (este texto será convertido em áudio)"
                  {...field}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seção de Áudio */}
        <div className="space-y-3 p-4 border rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Áudio do Esculacho</h3>
            <Button
              type="button"
              variant={audioUrl ? "outline" : "default"}
              size="sm"
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio || !conteudo || conteudo.trim().length === 0}
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : audioUrl ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerar Áudio
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Gerar Áudio
                </>
              )}
            </Button>
          </div>

          {audioSrc ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Preview do áudio gerado. Se estiver satisfeito, clique em &quot;Publicar Esculacho&quot;.
              </p>
              <AudioPlayer src={audioSrc} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Preencha o conteúdo e clique em &quot;Gerar Áudio&quot; para criar o áudio do esculacho.
            </p>
          )}
        </div>

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

        <Button
          type="submit"
          disabled={isPending || !audioUrl}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...
            </>
          ) : (
            "Publicar Esculacho"
          )}
        </Button>

        {!audioUrl && (
          <p className="text-xs text-center text-muted-foreground">
            Você precisa gerar o áudio antes de publicar o esculacho.
          </p>
        )}
      </form>
    </Form>
  );
}
