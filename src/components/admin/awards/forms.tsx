"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  addCategory,
  addNominee,
  addSeason,
  editCategory,
  editNominee,
  editSeason,
} from "@/actions/awardActions";
import type { AwardCategory, AwardNominee, AwardSeason } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import {
  FormLayout,
  toFormData,
  useAfterSave,
  type EntityFormProps,
} from "@/components/admin/forms/shared";
import { ImageUploadField } from "@/components/admin/forms/ImageUploadField";
import { SEASON_STATUS } from "./columns";

export const awardKeys = {
  seasons: () => queryKeys.rastaAwards.seasons(),
  categories: (seasonId: string) => ["categories", seasonId] as const,
  nominees: (categoryId: string) => ["nominees", categoryId] as const,
};

/** Depois de salvar, a página pública também precisa refletir a mudança. */
function useInvalidatePublic() {
  const qc = useQueryClient();
  return (seasonId?: string) => {
    void qc.invalidateQueries({ queryKey: queryKeys.rastaAwards.activeSeason() });
    if (seasonId) void qc.invalidateQueries({ queryKey: queryKeys.rastaAwards.votingData(seasonId) });
  };
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  const radio = useRovingRadio({
    count: options.length,
    activeIndex: options.findIndex((opt) => opt.value === value),
    onSelect: (index) => onChange(options[index].value),
  });

  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map((opt, index) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            {...radio.getItemProps(index)}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-10 rounded-lg border px-2 text-sm font-medium transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/40"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Temporada                                                            */
/* ------------------------------------------------------------------ */

const seasonSchema = z
  .object({
    title: z.string().min(1, "Informe o título."),
    year: z.number().int().min(2020, "Ano a partir de 2020.").max(2100),
    description: z.string(),
    start_date: z.string().min(1, "Informe a data de início."),
    end_date: z.string().min(1, "Informe a data de término."),
    status: z.enum(["draft", "active", "closed"]),
  })
  .refine((v) => v.end_date >= v.start_date, {
    path: ["end_date"],
    message: "O término precisa ser depois do início.",
  });
type SeasonValues = z.infer<typeof seasonSchema>;

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

export function SeasonForm({ item, onDone }: EntityFormProps<AwardSeason>) {
  const [pending, startTransition] = useTransition();
  const afterSave = useAfterSave(awardKeys.seasons(), onDone);
  const invalidatePublic = useInvalidatePublic();

  const form = useForm<SeasonValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      title: item?.title ?? "Rasta Awards",
      year: item?.year ?? new Date().getFullYear(),
      description: item?.description ?? "",
      start_date: toDateInput(item?.start_date),
      end_date: toDateInput(item?.end_date),
      status: item?.status ?? "draft",
    },
  });

  function onSubmit(v: SeasonValues) {
    startTransition(async () => {
      const fd = toFormData({ id: item?.id, ...v, year: String(v.year) });
      const result = item ? await editSeason(fd) : await addSeason(fd);
      if (await afterSave(result, { ok: item ? "Temporada atualizada" : "Temporada criada", fail: "Não foi possível salvar a temporada" })) {
        invalidatePublic(item?.id);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout submitLabel={item ? "Salvar" : "Criar temporada"} pending={pending}>
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input autoFocus {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="year" render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl><Input placeholder="Nova Era 52" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="start_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Início</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="end_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Término</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Segmented label="Status" value={field.value} onChange={field.onChange} options={SEASON_STATUS} />
              <FormDescription>Só uma temporada com votação aberta aparece no site.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </FormLayout>
      </form>
    </Form>
  );
}

/* ------------------------------------------------------------------ */
/* Categoria                                                            */
/* ------------------------------------------------------------------ */

const categorySchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(100, "Até 100 caracteres."),
  description: z.string(),
  display_order: z.number().int(),
});
type CategoryValues = z.infer<typeof categorySchema>;

export function CategoryForm({
  item,
  onDone,
  seasonId,
  nextOrder,
}: EntityFormProps<AwardCategory> & { seasonId: string; nextOrder: number }) {
  const [pending, startTransition] = useTransition();
  const afterSave = useAfterSave(awardKeys.categories(seasonId), onDone);
  const invalidatePublic = useInvalidatePublic();

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      display_order: item?.display_order ?? nextOrder,
    },
  });

  function onSubmit(v: CategoryValues) {
    startTransition(async () => {
      const fd = toFormData({
        id: item?.id,
        season_id: item?.season_id ?? seasonId,
        name: v.name,
        description: v.description,
        display_order: String(v.display_order),
      });
      const result = item ? await editCategory(fd) : await addCategory(fd);
      if (await afterSave(result, { ok: item ? "Categoria atualizada" : "Categoria criada", fail: "Não foi possível salvar a categoria" })) {
        invalidatePublic(seasonId);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout submitLabel={item ? "Salvar" : "Criar categoria"} pending={pending}>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl><Input autoFocus placeholder="Papagaio do Ano" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl><Textarea rows={3} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="display_order" render={({ field }) => (
            <FormItem className="max-w-32">
              <FormLabel>Ordem</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
              </FormControl>
              <FormDescription>Menor aparece primeiro.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </FormLayout>
      </form>
    </Form>
  );
}

/* ------------------------------------------------------------------ */
/* Indicado                                                             */
/* ------------------------------------------------------------------ */

const nomineeSchema = z.object({
  title: z.string().min(1, "Informe o nome do indicado.").max(200, "Até 200 caracteres."),
  description: z.string(),
  image_url: z.string().url("Link de imagem inválido.").or(z.literal("")),
  content_link: z.string().url("Link inválido.").or(z.literal("")),
  display_order: z.number().int(),
});
type NomineeValues = z.infer<typeof nomineeSchema>;

export function NomineeForm({
  item,
  onDone,
  categoryId,
  seasonId,
  nextOrder,
}: EntityFormProps<AwardNominee> & { categoryId: string; seasonId: string; nextOrder: number }) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const afterSave = useAfterSave(awardKeys.nominees(categoryId), onDone);
  const invalidatePublic = useInvalidatePublic();

  const form = useForm<NomineeValues>({
    resolver: zodResolver(nomineeSchema),
    defaultValues: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      image_url: item?.image_url ?? "",
      content_link: item?.content_link ?? "",
      display_order: item?.display_order ?? nextOrder,
    },
  });
  const image = form.watch("image_url");
  const validImage = /^https?:\/\//.test(image);

  function onSubmit(v: NomineeValues) {
    startTransition(async () => {
      const fd = toFormData({
        id: item?.id,
        category_id: item?.category_id ?? categoryId,
        title: v.title,
        description: v.description,
        image_url: v.image_url || null,
        content_link: v.content_link || null,
        display_order: String(v.display_order),
      });
      const result = item ? await editNominee(fd) : await addNominee(fd);
      if (await afterSave(result, { ok: item ? "Indicado atualizado" : "Indicado adicionado", fail: "Não foi possível salvar o indicado" })) {
        invalidatePublic(seasonId);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout submitLabel={item ? "Salvar" : "Adicionar"} pending={pending} disabled={uploading}>
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl><Input autoFocus {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl><Textarea rows={3} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="content_link" render={({ field }) => (
            <FormItem>
              <FormLabel>Link do conteúdo</FormLabel>
              <FormControl><Input inputMode="url" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="space-y-2">
            <FormField control={form.control} name="image_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Imagem</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    folder="awards"
                    disabled={pending}
                    onUploadingChange={setUploading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {validImage && (
              <div className="relative size-20 overflow-hidden rounded-lg border bg-muted">
                <Image src={image} alt="" fill sizes="80px" className="object-cover" unoptimized />
              </div>
            )}
          </div>
          <FormField control={form.control} name="display_order" render={({ field }) => (
            <FormItem className="max-w-32">
              <FormLabel>Ordem</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormLayout>
      </form>
    </Form>
  );
}
