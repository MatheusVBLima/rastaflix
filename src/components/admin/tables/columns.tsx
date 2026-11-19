"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import type { Clipe, Esculacho, Inimigo, Music, Story } from "@/lib/types";
import { inValues, type FilterOption } from "@/components/data-table/DataTable";
import { StatusBadge, STATUS_OPTIONS } from "@/components/inimigos/Inimigos";
import { VideoStatusBadge, VIDEO_STATUS_OPTIONS } from "@/components/admin/forms/VideoStatusField";
import { formatDate } from "@/lib/format";
import { getHostLabel } from "@/lib/media";

type Col<T> = ColumnDef<T, unknown>;

function optionsFrom(values: (string | null | undefined)[]): FilterOption[] {
  return [...new Set(values.filter((v): v is string => !!v))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((v) => ({ value: v, label: v }));
}

function dateCol<T extends { created_at?: string | null }>(): Col<T> {
  return {
    id: "created_at",
    accessorKey: "created_at",
    header: "Criado em",
    enableGlobalFilter: false,
    meta: { label: "Criado em", cellClassName: "whitespace-nowrap tabular-nums text-muted-foreground" },
    cell: ({ row }) => formatDate(row.original.created_at),
  };
}

function linkCol<T extends { url: string }>(): Col<T> {
  return {
    id: "url",
    accessorKey: "url",
    header: "Link",
    enableSorting: false,
    meta: { label: "Link" },
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
      >
        {getHostLabel(row.original.url) ?? "Abrir"}
        <ExternalLink className="size-3" aria-hidden />
      </a>
    ),
  };
}

function idCol<T extends { id: string }>(): Col<T> {
  return {
    id: "id",
    accessorKey: "id",
    header: "ID",
    enableSorting: false,
    meta: { label: "ID", cellClassName: "font-mono text-xs text-muted-foreground" },
    cell: ({ row }) => <span title={row.original.id}>{row.original.id.slice(0, 8)}</span>,
  };
}

function videoStatusCol<T extends { archived?: boolean }>(): Col<T> {
  return {
    id: "status",
    accessorFn: (r) => (r.archived ? "arquivado" : "ativo"),
    header: "Status",
    filterFn: inValues as never,
    enableGlobalFilter: false,
    meta: {
      label: "Status",
      filterOptions: [...VIDEO_STATUS_OPTIONS],
    },
    cell: ({ row }) => <VideoStatusBadge archived={row.original.archived} />,
  };
}

export const storyColumns = (data: Story[]): Col<Story>[] => [
  {
    id: "title",
    accessorKey: "title",
    header: "Título",
    meta: { label: "Título", cellClassName: "max-w-[22rem] font-medium" },
    cell: ({ row }) => <span className="line-clamp-2">{row.original.title}</span>,
  },
  videoStatusCol<Story>(),
  {
    id: "tags",
    accessorFn: (r) => r.tags,
    header: "Tags",
    enableSorting: false,
    filterFn: inValues as never,
    meta: { label: "Tags", filterOptions: optionsFrom(data.flatMap((s) => s.tags)) },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.map((t) => (
          <span key={t} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            #{t}
          </span>
        ))}
      </div>
    ),
  },
  linkCol<Story>(),
  dateCol<Story>(),
  idCol<Story>(),
];

export const musicColumns: Col<Music>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: "Título",
    meta: { label: "Título", cellClassName: "font-medium" },
  },
  videoStatusCol<Music>(),
  linkCol<Music>(),
  dateCol<Music>(),
  idCol<Music>(),
];

export const esculachoColumns = (data: Esculacho[]): Col<Esculacho>[] => [
  {
    id: "titulo",
    accessorKey: "titulo",
    header: "Título",
    meta: { label: "Título", cellClassName: "max-w-[18rem] font-medium" },
  },
  {
    id: "autor",
    accessorFn: (r) => r.autor ?? "",
    header: "Autor",
    filterFn: inValues as never,
    meta: { label: "Autor", filterOptions: optionsFrom(data.map((e) => e.autor)) },
  },
  {
    id: "conteudo",
    accessorKey: "conteudo",
    header: "Texto",
    enableSorting: false,
    meta: { label: "Texto", cellClassName: "max-w-[24rem] text-muted-foreground" },
    cell: ({ row }) => <span className="line-clamp-2">{row.original.conteudo}</span>,
  },
  {
    id: "audio",
    accessorFn: (r) => (r.audio_url ? "com" : "sem"),
    header: "Áudio",
    filterFn: inValues as never,
    enableGlobalFilter: false,
    meta: {
      label: "Áudio",
      filterOptions: [
        { value: "com", label: "Com áudio" },
        { value: "sem", label: "Sem áudio" },
      ],
    },
    cell: ({ row }) =>
      row.original.audio_url ? (
        <span className="text-sm">Sim</span>
      ) : (
        <span className="text-sm text-muted-foreground">Não</span>
      ),
  },
  dateCol<Esculacho>(),
];

export const inimigoColumns: Col<Inimigo>[] = [
  {
    id: "nome",
    accessorKey: "nome",
    header: "Nome",
    meta: { label: "Nome", cellClassName: "font-medium" },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    filterFn: inValues as never,
    meta: { label: "Status", filterOptions: STATUS_OPTIONS },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  dateCol<Inimigo>(),
  idCol<Inimigo>(),
];

export const clipeColumns: Col<Clipe>[] = [
  {
    id: "titulo",
    accessorKey: "titulo",
    header: "Título",
    meta: { label: "Título", cellClassName: "max-w-[24rem] font-medium" },
  },
  videoStatusCol<Clipe>(),
  {
    id: "plataforma",
    accessorKey: "plataforma",
    header: "Plataforma",
    filterFn: inValues as never,
    meta: {
      label: "Plataforma",
      filterOptions: [
        { value: "twitch", label: "Twitch" },
        { value: "kick", label: "Kick" },
      ],
    },
    cell: ({ row }) => (row.original.plataforma === "twitch" ? "Twitch" : "Kick"),
  },
  linkCol<Clipe>(),
  dateCol<Clipe>(),
];
