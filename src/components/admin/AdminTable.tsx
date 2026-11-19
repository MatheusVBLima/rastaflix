"use client";

import { Fragment, useCallback, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/ui/loader";
import { DataTable } from "@/components/data-table/DataTable";
import { DeleteIcon } from "@/components/icons/animated/delete";
import { SquarePenIcon } from "@/components/icons/animated/square-pen";
import { PlusIcon } from "@/components/icons/animated/plus";
import { useAnimatedIcon, type AnimatedIconHandle } from "@/hooks/use-animated-icon";

interface AdminTableProps<T extends { id: string }> {
  queryKey: readonly unknown[];
  /** Prefixo de cache invalidado após mutações (padrão: queryKey). */
  invalidateKey?: readonly unknown[];
  queryFn: () => Promise<T[]>;
  /** Colunas fixas, ou uma função dos dados (para filtros com opções dinâmicas). */
  columns: ColumnDef<T, unknown>[] | ((data: T[]) => ColumnDef<T, unknown>[]);
  /** ["história", "histórias"] */
  noun: [string, string];
  /** Gênero do substantivo, para concordância ("excluída"/"excluído", "nova"/"novo"). */
  gender?: "f" | "m";
  /** Texto que identifica o item nos diálogos. */
  getLabel: (row: T) => string;
  onDelete: (id: string) => Promise<{ success: boolean; message?: string }>;
  /** Ação rápida de arquivar/reativar na linha da tabela (para vídeos). */
  archive?: {
    isArchived: (row: T) => boolean;
    onToggle: (id: string, archived: boolean) => Promise<{ success: boolean; message?: string }>;
  };
  /** Formulário de criar/editar, aberto no painel lateral. */
  renderForm: (props: { item?: T; onDone: () => void }) => ReactNode;
  storageKey: string;
}

/** Array estável enquanto carrega (um [] novo a cada render refaz a tabela). */
const EMPTY: never[] = [];

type Editing<T> = { mode: "create" } | { mode: "edit"; item: T } | null;

/**
 * Tela de gestão de um tipo de conteúdo: tabela com busca/filtros/colunas,
 * "Adicionar" na barra e "Arquivar"/"Editar"/"Excluir" em cada linha.
 */
export function AdminTable<T extends { id: string }>({
  queryKey,
  invalidateKey,
  queryFn,
  columns,
  noun,
  gender = "m",
  getLabel,
  onDelete,
  archive,
  renderForm,
  storageKey,
}: AdminTableProps<T>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");
  const [editing, setEditing] = useState<Editing<T>>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const addIcon = useAnimatedIcon<AnimatedIconHandle>();

  const cacheKeyToInvalidate = invalidateKey ?? queryKey;

  const { data = EMPTY as T[], isLoading, error } = useQuery<T[]>({ queryKey, queryFn });

  const g =
    gender === "f"
      ? { done: "excluída", removed: "removida", new: "Nova", archived: "arquivada", restored: "reativada" }
      : { done: "excluído", removed: "removido", new: "Novo", archived: "arquivado", restored: "reativado" };

  const handleToggleArchive = useCallback(
    async (row: T) => {
      if (!archive) return;
      const nextArchived = !archive.isArchived(row);
      const label = getLabel(row);
      setTogglingId(row.id);
      try {
        const result = await archive.onToggle(row.id, nextArchived);
        if (result.success) {
          toast.success(
            `${capitalize(noun[0])} ${nextArchived ? g.archived : g.restored}`,
            { description: label }
          );
          router.refresh();
          await queryClient.invalidateQueries({ queryKey: cacheKeyToInvalidate });
        } else {
          toast.error("Não foi possível alterar o status", { description: result.message });
        }
      } catch {
        toast.error("Não foi possível alterar o status", { description: "Tente de novo em instantes." });
      } finally {
        setTogglingId(null);
      }
    },
    [archive, cacheKeyToInvalidate, g.archived, g.restored, getLabel, noun, queryClient, router]
  );

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(
    () => [
      ...(typeof columns === "function" ? columns(data) : columns),
      {
        id: "acoes",
        header: () => <span className="sr-only">Ações</span>,
        enableSorting: false,
        enableHiding: false,
        enableGlobalFilter: false,
        meta: {
          fixed: true,
          headerClassName: archive ? "w-32" : "w-24",
          cellClassName: "text-right",
        },
        cell: ({ row }) => {
          const archived = archive ? archive.isArchived(row.original) : false;
          const busy = togglingId === row.original.id;
          return (
            <div className="flex justify-end gap-1">
              {archive && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  className={
                    archived
                      ? "size-8 text-warning hover:bg-warning/10 hover:text-warning"
                      : "size-8 text-muted-foreground hover:text-foreground"
                  }
                  aria-label={`${archived ? "Reativar" : "Arquivar"} ${getLabel(row.original)}`}
                  title={archived ? "Reativar no site" : "Arquivar (ocultar do site)"}
                  onClick={() => void handleToggleArchive(row.original)}
                >
                  {busy ? (
                    <ButtonLoader label="Atualizando" />
                  ) : archived ? (
                    <ArchiveRestore className="size-4" aria-hidden />
                  ) : (
                    <Archive className="size-4" aria-hidden />
                  )}
                </Button>
              )}
              <RowAction
                label={`Editar ${getLabel(row.original)}`}
                icon={SquarePenIcon}
                onClick={() => setEditing({ mode: "edit", item: row.original })}
              />
              <RowAction
                label={`Excluir ${getLabel(row.original)}`}
                icon={DeleteIcon}
                destructive
                onClick={() => {
                  setDeleteLabel(getLabel(row.original));
                  setToDelete(row.original);
                }}
              />
            </div>
          );
        },
      },
    ],
    [archive, columns, data, getLabel, handleToggleArchive, togglingId]
  );

  function confirmDelete() {
    if (!toDelete) return;
    const label = getLabel(toDelete);
    startDelete(async () => {
      try {
        const result = await onDelete(toDelete.id);
        if (result.success) {
          toast.success(`${capitalize(noun[0])} ${g.done}`, { description: label });
          router.refresh();
          await queryClient.invalidateQueries({ queryKey: cacheKeyToInvalidate });
        } else {
          toast.error("Não foi possível excluir", { description: result.message });
        }
      } catch {
        toast.error("Não foi possível excluir", { description: "Tente de novo em instantes." });
      } finally {
        setToDelete(null);
      }
    });
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Não foi possível carregar: {(error as Error).message}
      </p>
    );
  }

  const editingItem = editing?.mode === "edit" ? editing.item : undefined;

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        getRowId={(r) => r.id}
        noun={noun}
        isLoading={isLoading}
        storageKey={storageKey}
        toolbarActions={
          <Button size="sm" onClick={() => setEditing({ mode: "create" })} {...addIcon.handlers}>
            <PlusIcon ref={addIcon.ref} size={16} aria-hidden />
            Adicionar
          </Button>
        }
      />

      <Sheet open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle className="font-display text-lg">
              {editingItem ? `Editar ${noun[0]}` : `${g.new} ${noun[0]}`}
            </SheetTitle>
            <SheetDescription className={editingItem ? "line-clamp-1" : "sr-only"}>
              {editingItem ? getLabel(editingItem) : `Preencha os dados para adicionar.`}
            </SheetDescription>
          </SheetHeader>
          {editing && (
            // key: trocar de item remonta o formulário com os valores certos
            <Fragment key={editingItem?.id ?? "novo"}>
              {renderForm({ item: editingItem, onDone: () => setEditing(null) })}
            </Fragment>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && !isDeleting && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {noun[0]}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete ? getLabel(toDelete) : deleteLabel}” será {g.removed} de vez. Isso não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && <ButtonLoader label="Excluindo" />}
              {isDeleting ? "Excluindo" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type AnimatedIcon = React.ComponentType<
  { size?: number; className?: string; "aria-hidden"?: boolean } & React.RefAttributes<AnimatedIconHandle>
>;

function RowAction({
  label,
  icon: Icon,
  onClick,
  destructive,
}: {
  label: string;
  icon: AnimatedIcon;
  onClick: () => void;
  destructive?: boolean;
}) {
  const icon = useAnimatedIcon<AnimatedIconHandle>();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={
        destructive
          ? "size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "size-8 text-muted-foreground hover:text-foreground"
      }
      aria-label={label}
      title={label}
      onClick={onClick}
      {...icon.handlers}
    >
      <Icon ref={icon.ref} size={16} aria-hidden />
    </Button>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
