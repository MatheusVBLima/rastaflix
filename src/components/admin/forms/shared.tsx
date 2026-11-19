"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/ui/loader";
import { SheetClose } from "@/components/ui/sheet";
import type { ActionResponse } from "@/lib/types";

export interface EntityFormProps<T> {
  /** Item em edição; ausente = criar. */
  item?: T;
  /** Chamado depois de salvar com sucesso (fecha o painel). */
  onDone: () => void;
}

/**
 * Pós-salvamento comum: avisa, atualiza a lista e a rota, fecha o painel.
 */
export function useAfterSave(queryKey: readonly unknown[], onDone: () => void) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async (result: ActionResponse, fallback: { ok: string; fail: string }) => {
    if (result.success) {
      toast.success(result.message || fallback.ok);
      await queryClient.invalidateQueries({ queryKey });
      router.refresh();
      onDone();
      return true;
    }
    toast.error(result.message || fallback.fail, {
      description: result.errors?.map((e) => e.message).join("\n"),
    });
    return false;
  };
}

/** Corpo rolável + rodapé fixo com Cancelar / Salvar. */
export function FormLayout({
  children,
  submitLabel,
  pending,
  disabled,
}: {
  children: ReactNode;
  submitLabel: string;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 pt-5">{children}</div>
      <div className="flex justify-end gap-2 border-t bg-background px-4 py-3">
        <SheetClose asChild>
          <Button type="button" variant="ghost" disabled={pending}>
            Cancelar
          </Button>
        </SheetClose>
        <Button type="submit" disabled={pending || disabled} className="min-w-28">
          {pending && <ButtonLoader label="Salvando" />}
          {pending ? "Salvando" : submitLabel}
        </Button>
      </div>
    </>
  );
}

export function toFormData(values: Record<string, string | null | undefined>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) fd.append(key, value);
  }
  return fd;
}
