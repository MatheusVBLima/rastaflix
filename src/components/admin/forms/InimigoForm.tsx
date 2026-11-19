"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addInimigo, editInimigo } from "@/actions/inimigoActions";
import { InimigoSchema, type Inimigo, type InimigoFormData } from "@/lib/types";
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
import { StatusBadge, STATUS_OPTIONS } from "@/components/inimigos/Inimigos";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { cn } from "@/lib/utils";
import { FormLayout, toFormData, useAfterSave, type EntityFormProps } from "./shared";

export function InimigoForm({ item, onDone }: EntityFormProps<Inimigo>) {
  const [pending, startTransition] = useTransition();
  const afterSave = useAfterSave(queryKeys.inimigos.list(), onDone);

  const form = useForm<InimigoFormData>({
    resolver: zodResolver(InimigoSchema),
    defaultValues: { nome: item?.nome ?? "", status: item?.status ?? "pendente" },
  });

  function onSubmit(values: InimigoFormData) {
    startTransition(async () => {
      const fd = toFormData(values);
      const result = item ? await editInimigo(item.id, fd) : await addInimigo(fd);
      await afterSave(result, {
        ok: item ? "Inimigo atualizado" : "Inimigo adicionado",
        fail: "Não foi possível salvar o inimigo",
      });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <FormLayout submitLabel={item ? "Salvar" : "Adicionar"} pending={pending}>
          <FormField
            control={form.control}
            name="nome"
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <StatusRadioGroup value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />
        </FormLayout>
      </form>
    </Form>
  );
}

function StatusRadioGroup({
  value,
  onChange,
}: {
  value: InimigoFormData["status"];
  onChange: (value: InimigoFormData["status"]) => void;
}) {
  const radio = useRovingRadio({
    count: STATUS_OPTIONS.length,
    activeIndex: STATUS_OPTIONS.findIndex((opt) => opt.value === value),
    onSelect: (index) => onChange(STATUS_OPTIONS[index].value as InimigoFormData["status"]),
  });

  return (
    <div role="radiogroup" aria-label="Status" className="grid grid-cols-2 gap-2">
      {STATUS_OPTIONS.map((opt, index) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            {...radio.getItemProps(index)}
            onClick={() => onChange(opt.value as InimigoFormData["status"])}
            className={cn(
              "flex h-12 items-center justify-center rounded-lg border transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent/40"
            )}
          >
            <StatusBadge status={opt.value as Inimigo["status"]} />
          </button>
        );
      })}
    </div>
  );
}
