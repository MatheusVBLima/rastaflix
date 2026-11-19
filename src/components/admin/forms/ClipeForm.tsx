"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClipe, editClipe } from "@/actions/clipesActions";
import { ClipeSchema, type Clipe, type ClipeFormData } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
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
import { TwitchLogo } from "@/components/icons/TwitchLogo";
import { KickLogo } from "@/components/icons/KickLogo";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { cn } from "@/lib/utils";
import { CoverPreview } from "./CoverPreview";
import { ImageUploadField } from "./ImageUploadField";
import { VideoStatusRadioGroup } from "./VideoStatusField";
import { FormLayout, toFormData, useAfterSave, type EntityFormProps } from "./shared";

function detectPlatform(url: string): ClipeFormData["plataforma"] | null {
  try {
    const host = new URL(url).hostname;
    if (host.includes("twitch.tv")) return "twitch";
    if (host.includes("kick.com")) return "kick";
  } catch {
    /* URL incompleta */
  }
  return null;
}

const PLATFORMS = [
  { value: "twitch", label: "Twitch", Logo: TwitchLogo },
  { value: "kick", label: "Kick", Logo: KickLogo },
] as const;

export function ClipeForm({ item, onDone }: EntityFormProps<Clipe>) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const afterSave = useAfterSave(queryKeys.clipes.all, onDone);

  const form = useForm<ClipeFormData>({
    resolver: zodResolver(ClipeSchema),
    defaultValues: {
      titulo: item?.titulo ?? "",
      url: item?.url ?? "",
      thumbnail_url: item?.thumbnail_url ?? "",
      plataforma: item?.plataforma ?? "twitch",
      archived: item?.archived ?? false,
    },
  });

  const url = form.watch("url");
  const thumb = form.watch("thumbnail_url");
  const titulo = form.watch("titulo");

  // A plataforma segue o link colado.
  useEffect(() => {
    const detected = detectPlatform(url);
    if (detected && detected !== form.getValues("plataforma")) {
      form.setValue("plataforma", detected, { shouldValidate: true });
    }
  }, [url, form]);

  function onSubmit(values: ClipeFormData) {
    startTransition(async () => {
      const fd = toFormData({
        id: item?.id,
        titulo: values.titulo,
        url: values.url,
        plataforma: values.plataforma,
        thumbnail_url: values.thumbnail_url ?? "",
        archived: String(Boolean(values.archived)),
      });
      const result = item ? await editClipe(fd) : await addClipe(fd);
      await afterSave(result, {
        ok: item ? "Clipe atualizado" : "Clipe adicionado",
        fail: "Não foi possível salvar o clipe",
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout submitLabel={item ? "Salvar" : "Adicionar"} pending={pending} disabled={uploading}>
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
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do clipe</FormLabel>
                <FormControl>
                  <Input inputMode="url" placeholder="https://clips.twitch.tv/…" {...field} />
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
                <PlatformRadioGroup value={field.value} onChange={field.onChange} />
                <FormDescription>Detectada pelo link.</FormDescription>
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
                <VideoStatusRadioGroup value={Boolean(field.value)} onChange={field.onChange} />
                <FormDescription>
                  Clipes arquivados ficam ocultos para usuários e podem ser reativados depois.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="thumbnail_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    folder="clipes"
                    disabled={pending}
                    onUploadingChange={setUploading}
                  />
                </FormControl>
                <FormDescription>Twitch e Kick não fornecem a thumbnail pelo link do clipe.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <CoverPreview url={null} imageUrl={thumb} title={titulo} />
        </FormLayout>
      </form>
    </Form>
  );
}

function PlatformRadioGroup({
  value,
  onChange,
}: {
  value: ClipeFormData["plataforma"];
  onChange: (value: ClipeFormData["plataforma"]) => void;
}) {
  const radio = useRovingRadio({
    count: PLATFORMS.length,
    activeIndex: PLATFORMS.findIndex((p) => p.value === value),
    onSelect: (index) => onChange(PLATFORMS[index].value),
  });

  return (
    <div role="radiogroup" aria-label="Plataforma" className="grid grid-cols-2 gap-2">
      {PLATFORMS.map(({ value: optValue, label, Logo }, index) => {
        const selected = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            role="radio"
            aria-checked={selected}
            {...radio.getItemProps(index)}
            onClick={() => onChange(optValue)}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/40"
            )}
          >
            <Logo className="h-3.5 w-auto" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
