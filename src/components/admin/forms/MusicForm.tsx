"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMusic, editMusic } from "@/actions/musicActions";
import type { Music } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { getYoutubeId } from "@/lib/media";
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
import { CoverPreview } from "./CoverPreview";
import { ImageUploadField } from "./ImageUploadField";
import { VideoStatusRadioGroup } from "./VideoStatusField";
import { FormLayout, toFormData, useAfterSave, type EntityFormProps } from "./shared";

const schema = z.object({
  title: z.string().min(1, "Informe o nome da música."),
  url: z.string().url("Cole um link válido."),
  imageUrl: z.string().url("Link de imagem inválido.").or(z.literal("")),
  archived: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function MusicForm({ item, onDone }: EntityFormProps<Music>) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const afterSave = useAfterSave(queryKeys.musicas.all, onDone);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title ?? "",
      url: item?.url ?? "",
      imageUrl: item?.imageUrl ?? "",
      archived: item?.archived ?? false,
    },
  });

  const url = form.watch("url");
  const imageUrl = form.watch("imageUrl");
  const title = form.watch("title");
  const ytId = getYoutubeId(url);

  function onSubmit(values: Values) {
    startTransition(async () => {
      const fd = toFormData({
        id: item?.id,
        title: values.title,
        url: values.url,
        imageUrl: ytId
          ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
          : values.imageUrl || null,
        archived: String(values.archived),
      });
      const result = item ? await editMusic(fd) : await addMusic(fd);
      await afterSave(result, {
        ok: item ? "Música atualizada" : "Música adicionada",
        fail: "Não foi possível salvar a música",
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout submitLabel={item ? "Salvar" : "Adicionar"} pending={pending} disabled={uploading}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input autoFocus {...field} />
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
                <FormLabel>Link</FormLabel>
                <FormControl>
                  <Input inputMode="url" placeholder="https://youtube.com/watch?v=…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="archived"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <VideoStatusRadioGroup value={field.value} onChange={field.onChange} />
                <FormDescription>
                  Músicas arquivadas ficam ocultas para usuários e podem ser reativadas depois.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {!ytId && (
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capa</FormLabel>
                  <FormControl>
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      folder="musicas"
                      disabled={pending}
                      onUploadingChange={setUploading}
                    />
                  </FormControl>
                  <FormDescription>Links do YouTube usam a thumbnail do vídeo automaticamente.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <CoverPreview url={url} imageUrl={imageUrl} title={title} square />
        </FormLayout>
      </form>
    </Form>
  );
}
