"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addEsculacho, editEsculacho } from "@/actions/esculachoActions";
import { EsculachoSchema, type Esculacho, type EsculachoFormData } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/ui/loader";
import { ClipAudio } from "@/components/audio/ClipAudio";
import { AudioLinesIcon } from "@/components/icons/animated/audio-lines";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";
import { FormLayout, toFormData, useAfterSave, type EntityFormProps } from "./shared";

export function EsculachoForm({ item, onDone }: EntityFormProps<Esculacho>) {
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  /** Áudio novo gerado nesta edição (ainda não salvo) e o texto usado para gerá-lo. */
  const [newAudio, setNewAudio] = useState<{ url: string; text: string } | null>(null);
  const afterSave = useAfterSave(queryKeys.esculachos.list(), onDone);
  const genIcon = useAnimatedIcon<AnimatedIconHandle>();

  const form = useForm<EsculachoFormData>({
    resolver: zodResolver(EsculachoSchema),
    defaultValues: {
      titulo: item?.titulo ?? "",
      descricao: item?.descricao ?? "",
      conteudo: item?.conteudo ?? "",
      autor: item?.autor ?? "",
    },
  });

  const conteudo = form.watch("conteudo");
  const textChanged = !item || conteudo !== item.conteudo;
  const freshAudioUrl = newAudio && newAudio.text === conteudo.trim() ? newAudio.url : null;
  // O áudio precisa acompanhar o texto: novo esculacho ou texto alterado pedem áudio novo.
  const needsAudio = textChanged && !freshAudioUrl;
  const audioSrc = freshAudioUrl ?? (textChanged ? null : item?.audio_url ?? null);

  async function generateAudio() {
    const text = form.getValues("conteudo").trim();
    if (!text) {
      form.setError("conteudo", { message: "Escreva o texto antes de gerar o áudio." });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar áudio");
      setNewAudio({ url: data.audioUrl, text });
      toast.success("Áudio gerado");
    } catch (error) {
      toast.error("Não foi possível gerar o áudio", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setGenerating(false);
    }
  }

  function onSubmit(values: EsculachoFormData) {
    if (needsAudio) {
      toast.error(item ? "O texto mudou: gere o áudio de novo antes de salvar." : "Gere o áudio antes de adicionar.");
      return;
    }
    startTransition(async () => {
      const fd = toFormData({ id: item?.id, ...values, audioUrl: freshAudioUrl });
      const result = item ? await editEsculacho(fd) : await addEsculacho(fd);
      await afterSave(result, {
        ok: item ? "Esculacho atualizado" : "Esculacho adicionado",
        fail: "Não foi possível salvar o esculacho",
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout
          submitLabel={item ? "Salvar" : "Adicionar"}
          pending={pending}
          disabled={generating || (Boolean(item) && needsAudio)}
        >
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input autoFocus {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                <FormLabel>Texto</FormLabel>
                <FormControl>
                  <Textarea rows={8} className="max-h-72 overflow-y-auto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <section aria-labelledby="audio-label" className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <p id="audio-label" className="text-sm font-medium">
                Áudio
              </p>
              <Button
                type="button"
                variant={needsAudio ? "default" : "outline"}
                size="sm"
                onClick={generateAudio}
                disabled={generating || pending}
                {...genIcon.handlers}
              >
                {generating ? (
                  <ButtonLoader label="Gerando áudio" />
                ) : (
                  <AudioLinesIcon ref={genIcon.ref} size={16} aria-hidden />
                )}
                {generating ? "Gerando" : audioSrc ? "Gerar de novo" : "Gerar áudio"}
              </Button>
            </div>
            {audioSrc ? (
              <ClipAudio id={`preview-${item?.id ?? "novo"}`} src={audioSrc} downloadName={form.getValues("titulo")} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {item ? "O texto mudou. Gere o áudio de novo para salvar." : "Gere o áudio a partir do texto para poder adicionar."}
              </p>
            )}
          </section>
        </FormLayout>
      </form>
    </Form>
  );
}
