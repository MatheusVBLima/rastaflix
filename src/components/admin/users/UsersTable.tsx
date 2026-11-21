"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, ShieldCheck, User } from "lucide-react";
import { DataTable, inValues } from "@/components/data-table/DataTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelative } from "@/lib/format";
import type { AdminUserRole, AdminUserRow } from "@/lib/types";
import { initials } from "@/components/admin/dashboard/format";

type Col = ColumnDef<AdminUserRow, unknown>;

export function RoleBadge({ role }: { role: AdminUserRole }) {
  return role === "admin" ? (
    <Badge variant="default" className="gap-1">
      <ShieldCheck aria-hidden />
      Admin
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <User aria-hidden />
      Usuário
    </Badge>
  );
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Usuário" },
];

const ACTIVITY_OPTIONS = [
  { value: "jogador", label: "Jogou algum jogo" },
  { value: "eleitor", label: "Votou no Awards" },
  { value: "inativo", label: "Sem atividade" },
];

function activityTags(r: AdminUserRow) {
  const tags: string[] = [];
  if (r.gamesPlayed > 0) tags.push("jogador");
  if (r.votes > 0) tags.push("eleitor");
  if (!tags.length) tags.push("inativo");
  return tags;
}

const numberCell = (v: number | null) =>
  v === null || v === 0 ? (
    <span className="text-muted-foreground/60">—</span>
  ) : (
    v.toLocaleString("pt-BR")
  );

const columns: Col[] = [
  {
    id: "name",
    // Busca por nome e @username ao mesmo tempo
    accessorFn: (r) => `${r.name} ${r.username ?? ""}`.trim(),
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name, "pt-BR"),
    header: "Usuário",
    meta: { label: "Usuário" },
    cell: ({ row }) => {
      const u = row.original;
      return (
        <Link
          href={`/admin/usuarios/${u.id}`}
          transitionTypes={["nav-forward"]}
          className="group flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-8">
            {u.imageUrl && <AvatarImage src={u.imageUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate font-medium underline-offset-4 group-hover:underline">
              {u.name}
            </span>
            {u.username && (
              <span className="block truncate text-xs text-muted-foreground">@{u.username}</span>
            )}
          </span>
        </Link>
      );
    },
  },
  {
    id: "email",
    accessorKey: "email",
    header: "E-mail",
    meta: { label: "E-mail", cellClassName: "text-sm text-muted-foreground" },
    cell: ({ row }) => row.original.email ?? "—",
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Papel",
    filterFn: inValues as never,
    enableGlobalFilter: false,
    meta: { label: "Papel", filterOptions: ROLE_OPTIONS },
    cell: ({ row }) => <RoleBadge role={row.original.role} />,
  },
  {
    id: "activity",
    accessorFn: activityTags,
    header: "Atividade",
    enableSorting: false,
    enableGlobalFilter: false,
    filterFn: inValues as never,
    meta: { label: "Atividade", filterOptions: ACTIVITY_OPTIONS },
    cell: ({ row }) => {
      const tags = activityTags(row.original);
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <Badge key={t} variant="outline" className="font-normal text-muted-foreground">
              {ACTIVITY_OPTIONS.find((o) => o.value === t)?.label.split(" ")[0]}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "gamesPlayed",
    accessorKey: "gamesPlayed",
    header: "Partidas",
    enableGlobalFilter: false,
    meta: { label: "Partidas", cellClassName: "font-mono tabular-nums" },
    cell: ({ row }) => numberCell(row.original.gamesPlayed),
  },
  {
    id: "bestScore",
    accessorFn: (r) => r.bestScore ?? -1,
    header: "Recorde",
    enableGlobalFilter: false,
    meta: { label: "Recorde", cellClassName: "font-mono tabular-nums" },
    cell: ({ row }) => numberCell(row.original.bestScore),
  },
  {
    id: "votes",
    accessorKey: "votes",
    header: "Votos",
    enableGlobalFilter: false,
    meta: { label: "Votos", cellClassName: "font-mono tabular-nums" },
    cell: ({ row }) => numberCell(row.original.votes),
  },
  {
    id: "createdAt",
    accessorFn: (r) => r.createdAt ?? "",
    header: "Cadastro",
    enableGlobalFilter: false,
    meta: { label: "Cadastro", cellClassName: "whitespace-nowrap tabular-nums text-muted-foreground" },
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "lastSignInAt",
    accessorFn: (r) => r.lastSignInAt ?? "",
    header: "Último acesso",
    enableGlobalFilter: false,
    meta: { label: "Último acesso", cellClassName: "whitespace-nowrap text-muted-foreground" },
    cell: ({ row }) => (
      <span title={formatDate(row.original.lastSignInAt)}>
        {formatRelative(row.original.lastSignInAt) ?? "Nunca"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Ações</span>,
    enableSorting: false,
    enableHiding: false,
    meta: { fixed: true, headerClassName: "w-px", cellClassName: "text-right" },
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/usuarios/${row.original.id}`} transitionTypes={["nav-forward"]}>
          Ver perfil
          <ArrowUpRight aria-hidden />
        </Link>
      </Button>
    ),
  },
];

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={users}
      getRowId={(u) => u.id}
      noun={["usuário", "usuários"]}
      storageKey="admin-usuarios"
      initialSorting={[{ id: "createdAt", desc: true }]}
      pageSize={20}
      emptyState="Nenhum usuário cadastrado."
    />
  );
}
