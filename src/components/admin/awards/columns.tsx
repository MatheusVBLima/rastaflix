"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import type { AwardCategory, AwardNominee, AwardSeason } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { inValues } from "@/components/data-table/DataTable";
import { formatDate } from "@/lib/format";

type Col<T> = ColumnDef<T, unknown>;

export const SEASON_STATUS: { value: AwardSeason["status"]; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Votação aberta" },
  { value: "closed", label: "Encerrada" },
];

export function SeasonStatusBadge({ status }: { status: AwardSeason["status"] }) {
  const label = SEASON_STATUS.find((s) => s.value === status)?.label ?? status;
  return (
    <Badge variant={status === "active" ? "default" : status === "closed" ? "secondary" : "outline"}>
      {label}
    </Badge>
  );
}

export const seasonColumns: Col<AwardSeason>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: "Título",
    meta: { label: "Título", cellClassName: "font-medium" },
  },
  {
    id: "description",
    accessorFn: (r) => r.description ?? "",
    header: "Descrição",
    enableSorting: false,
    meta: { label: "Descrição", cellClassName: "max-w-[18rem] text-muted-foreground" },
    cell: ({ row }) => <span className="line-clamp-1">{row.original.description || "—"}</span>,
  },
  {
    id: "year",
    accessorKey: "year",
    header: "Ano",
    enableGlobalFilter: false,
    meta: { label: "Ano", cellClassName: "tabular-nums" },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    filterFn: inValues as never,
    meta: { label: "Status", filterOptions: SEASON_STATUS },
    cell: ({ row }) => <SeasonStatusBadge status={row.original.status} />,
  },
  {
    id: "periodo",
    accessorKey: "start_date",
    header: "Período",
    enableGlobalFilter: false,
    meta: { label: "Período", cellClassName: "whitespace-nowrap tabular-nums text-muted-foreground" },
    cell: ({ row }) => `${formatDate(row.original.start_date)} – ${formatDate(row.original.end_date)}`,
  },
];

export const categoryColumns: Col<AwardCategory>[] = [
  {
    id: "display_order",
    accessorKey: "display_order",
    header: "Ordem",
    enableGlobalFilter: false,
    meta: { label: "Ordem", headerClassName: "w-24", cellClassName: "tabular-nums text-muted-foreground" },
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
    meta: { label: "Nome", cellClassName: "font-medium" },
  },
  {
    id: "description",
    accessorFn: (r) => r.description ?? "",
    header: "Descrição",
    enableSorting: false,
    meta: { label: "Descrição", cellClassName: "max-w-[24rem] text-muted-foreground" },
    cell: ({ row }) => <span className="line-clamp-2">{row.original.description || "—"}</span>,
  },
];

export const nomineeColumns: Col<AwardNominee>[] = [
  {
    id: "display_order",
    accessorKey: "display_order",
    header: "Ordem",
    enableGlobalFilter: false,
    meta: { label: "Ordem", headerClassName: "w-24", cellClassName: "tabular-nums text-muted-foreground" },
  },
  {
    id: "title",
    accessorKey: "title",
    header: "Indicado",
    meta: { label: "Indicado", cellClassName: "font-medium" },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.image_url ? (
          <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={row.original.image_url} alt="" fill sizes="36px" className="object-cover" unoptimized />
          </span>
        ) : (
          <span className="size-9 shrink-0 rounded-md bg-muted" aria-hidden />
        )}
        <span className="line-clamp-2">{row.original.title}</span>
      </div>
    ),
  },
  {
    id: "description",
    accessorFn: (r) => r.description ?? "",
    header: "Descrição",
    enableSorting: false,
    meta: { label: "Descrição", cellClassName: "max-w-[20rem] text-muted-foreground" },
    cell: ({ row }) => <span className="line-clamp-2">{row.original.description || "—"}</span>,
  },
  {
    id: "content_link",
    accessorFn: (r) => r.content_link ?? "",
    header: "Conteúdo",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { label: "Conteúdo" },
    cell: ({ row }) =>
      row.original.content_link ? (
        <a
          href={row.original.content_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
        >
          Abrir <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];
