"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import NumberFlow from "@number-flow/react";
import { Clock, Skull } from "lucide-react";
import { fetchInimigos } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { Inimigo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, inValues } from "@/components/data-table/DataTable";
import { formatDate } from "@/lib/format";

const NO_INIMIGOS: Inimigo[] = [];

export const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "vingado", label: "Vingado" },
];

export function StatusBadge({ status }: { status: Inimigo["status"] }) {
  return (
    <Badge variant={status === "vingado" ? "vingado" : "pendente"} className="gap-1.5 px-2 py-0.5">
      {status === "vingado" ? <Skull /> : <Clock />}
      {status === "vingado" ? "Vingado" : "Pendente"}
    </Badge>
  );
}

const columns: ColumnDef<Inimigo, unknown>[] = [
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
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: { label: "Status", filterOptions: STATUS_OPTIONS },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Na lista desde",
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <time dateTime={row.original.created_at} className="tabular-nums text-muted-foreground">
        {formatDate(row.original.created_at)}
      </time>
    ),
    meta: { label: "Na lista desde" },
  },
];

export function Inimigos() {
  const { data: inimigos = NO_INIMIGOS, isLoading, error } = useQuery<Inimigo[], Error>({
    queryKey: queryKeys.inimigos.list(),
    queryFn: fetchInimigos,
  });

  const placar = useMemo(
    () => ({
      vingados: inimigos.filter((i) => i.status === "vingado").length,
      pendentes: inimigos.filter((i) => i.status === "pendente").length,
    }),
    [inimigos]
  );

  if (error) {
    return (
      <EmptyState
        title="Não foi possível carregar os inimigos"
        description={error.message}
      />
    );
  }

  if (!isLoading && inimigos.length === 0) {
    return (
      <EmptyState
        icon={Skull}
        title="Mural vazio"
        description="Ninguém entrou na lista ainda. Ou todos já foram perdoados."
      />
    );
  }

  const total = placar.vingados + placar.pendentes;
  const pct = total ? (placar.vingados / total) * 100 : 0;

  return (
    <div className="space-y-8">
      <section aria-label="Placar da vingança" className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Vingados</p>
          <NumberFlow
            value={placar.vingados}
            className="font-display text-4xl font-semibold text-success"
          />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <NumberFlow
            value={placar.pendentes}
            className="font-display text-4xl font-semibold text-warning"
          />
        </div>
        <div className="col-span-2 flex flex-col justify-end gap-3 rounded-xl border bg-card p-5 sm:col-span-1">
          <p className="text-sm text-muted-foreground">
            <NumberFlow
              value={Math.round(pct)}
              suffix="%"
              className="font-medium text-foreground"
            />{" "}
            da vingança cumprida
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-warning/20">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <DataTable
        columns={columns}
        data={inimigos}
        getRowId={(r) => r.id}
        noun={["inimigo", "inimigos"]}
        isLoading={isLoading}
        storageKey="rastaflix:inimigos"
        initialSorting={[{ id: "created_at", desc: true }]}
      />
    </div>
  );
}
