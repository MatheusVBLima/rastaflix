"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import NumberFlow from "@number-flow/react";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [10, 20, 50, 100];

export function DataTablePagination<TData>({
  table,
  noun,
}: {
  table: Table<TData>;
  noun: [string, string];
}) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(1, table.getPageCount());
  const total = table.getFilteredRowModel().rows.length;
  const [draft, setDraft] = React.useState(String(pageIndex + 1));
  const inputId = React.useId();
  const sizeId = React.useId();

  React.useEffect(() => setDraft(String(pageIndex + 1)), [pageIndex]);

  function goTo(value: string) {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) {
      setDraft(String(pageIndex + 1));
      return;
    }
    const clamped = Math.min(Math.max(n, 1), pageCount);
    table.setPageIndex(clamped - 1);
    setDraft(String(clamped));
  }

  return (
    <div className="flex flex-col-reverse items-center gap-3 text-sm sm:flex-row sm:justify-between">
      <p className="tabular-nums text-muted-foreground" aria-live="polite">
        <NumberFlow value={total} className="font-medium text-foreground" />{" "}
        {total === 1 ? noun[0] : noun[1]}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor={sizeId} className="text-muted-foreground">
            Por página
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger id={sizeId} size="sm" className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav aria-label="Paginação" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Primeira página"
          >
            <ChevronFirst />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>

          <form
            className="flex items-center gap-1.5 px-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              goTo(draft);
            }}
          >
            <label htmlFor={inputId} className="text-muted-foreground">
              Página
            </label>
            <input
              id={inputId}
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={() => goTo(draft)}
              className="h-8 w-12 rounded-md border border-input bg-background text-center tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
            />
            <span className="text-muted-foreground tabular-nums">de {pageCount}</span>
          </form>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Última página"
          >
            <ChevronLast />
          </Button>
        </nav>
      </div>
    </div>
  );
}
