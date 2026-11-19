"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addStory, editStory } from "@/actions/storyActions";
import type { Story } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { CoverPreview } from "./CoverPreview";
import { ImageUploadField } from "./ImageUploadField";
import { VideoStatusRadioGroup } from "./VideoStatusField";
import { FormLayout, toFormData, useAfterSave, type EntityFormProps } from "./shared";

const schema = z.object({
  title: z.string().min(3, "Use pelo menos 3 caracteres."),
  url: z.string().url("Cole um link válido."),
  description: z.string().min(1, "Escreva uma descrição."),
  tags: z
    .string()
    .refine((v) => v.split(",").some((t) => t.trim()), "Informe pelo menos uma tag."),
  imageUrl: z.string().url("Link de imagem inválido.").or(z.literal("")),
  archived: z.boolean(),
});
type Values = z.infer<typeof schema>;

/** Capa: thumbnail do YouTube quando o link é de vídeo; senão a imagem informada. */
function resolveImage(url: string, imageUrl: string) {
  const id = getYoutubeId(url);
  if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  if (imageUrl) return imageUrl;
  return `${window.location.origin}/placeholder.png`;
}

export function StoryForm({ item, onDone }: EntityFormProps<Story>) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const afterSave = useAfterSave(queryKeys.historias.all, onDone);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title ?? "",
      url: item?.url ?? "",
      description: item?.description ?? "",
      tags: item?.tags.join(", ") ?? "",
      imageUrl: item?.imageUrl && !item.imageUrl.includes("via.placeholder") ? item.imageUrl : "",
      archived: item?.archived ?? false,
    },
  });

  const url = form.watch("url");
  const imageUrl = form.watch("imageUrl");
  const title = form.watch("title");
  const isYoutube = !!getYoutubeId(url);

  function onSubmit(values: Values) {
    startTransition(async () => {
      const fd = toFormData({
        id: item?.id,
        title: values.title,
        url: values.url,
        description: values.description,
        tags: values.tags,
        imageUrl: resolveImage(values.url, values.imageUrl),
        archived: String(values.archived),
      });
      const result = item ? await editStory(undefined, fd) : await addStory(undefined, fd);
      await afterSave(result, {
        ok: item ? "História atualizada" : "História adicionada",
        fail: "Não foi possível salvar a história",
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
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
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input placeholder="modom, esculacho" {...field} />
                </FormControl>
                <FormDescription>Separe com vírgula.</FormDescription>
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
                  Vídeos arquivados ficam ocultos para usuários e podem ser reativados depois.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isYoutube && (
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
                      folder="historias"
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
          <CoverPreview url={url} imageUrl={imageUrl} title={title} />
        </FormLayout>
      </form>
    </Form>
  );
}
