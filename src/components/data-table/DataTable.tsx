"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type FilterFn,
  type Header,
  type Cell,
  type PaginationState,
  type SortingState,
  type Updater,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  ListFilter,
} from "lucide-react";
import {
  useAnimatedIcon,
  type AnimatedIconHandle,
} from "@/hooks/use-animated-icon";
import { GripVerticalIcon } from "@/components/icons/animated/grip-vertical";
import { RotateCCWIcon } from "@/components/icons/animated/rotate-ccw";
import { SlidersHorizontalIcon } from "@/components/icons/animated/sliders-horizontal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/layout/SearchField";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "./DataTablePagination";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Metadados de coluna                                                  */
/* ------------------------------------------------------------------ */

export interface FilterOption {
  value: string;
  label: string;
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Nome legível (menu de colunas e filtros). */
    label?: string;
    /** Gera um filtro por valores para esta coluna. */
    filterOptions?: FilterOption[];
    /** Coluna fixa: não arrasta nem some (ex.: ações). */
    fixed?: boolean;
    headerClassName?: string;
    cellClassName?: string;
  }
}

/** Filtro "está entre os valores selecionados" (string ou array de strings). */
export const inValues: FilterFn<unknown> = (row, columnId, value: string[]) => {
  if (!value?.length) return true;
  const cell = row.getValue(columnId);
  if (Array.isArray(cell)) return cell.some((v) => value.includes(String(v)));
  return value.includes(String(cell));
};

/* ------------------------------------------------------------------ */
/* Persistência local (ordem e visibilidade de colunas)                 */
/* ------------------------------------------------------------------ */

function usePersistentState<T>(key: string | undefined, initial: T) {
  const [state, setState] = React.useState<T>(initial);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      /* sem storage: segue com o padrão */
    }
    loaded.current = true;
  }, [key]);

  React.useEffect(() => {
    if (!key || !loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state]);

  return [state, setState] as const;
}

/* ------------------------------------------------------------------ */
/* DataTable                                                            */
/* ------------------------------------------------------------------ */

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  /** Nome do item, para a busca e os contadores: ["história", "histórias"]. */
  noun: [string, string];
  isLoading?: boolean;
  /** Chave do localStorage para lembrar ordem/visibilidade das colunas. */
  storageKey?: string;
  initialSorting?: SortingState;
  pageSize?: number;
  /** Ações extras no topo, à direita (ex.: botão "Adicionar"). */
  toolbarActions?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  noun,
  isLoading,
  storageKey,
  initialSorting = [],
  pageSize = 10,
  toolbarActions,
  emptyState,
  className,
}: DataTableProps<TData>) {
  const defaultOrder = React.useMemo(
    () => columns.map((c, i) => c.id ?? (c as { accessorKey?: string }).accessorKey ?? String(i)),
    [columns]
  );

  const [sorting, setSortingState] = React.useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilterState] = React.useState("");
  const [columnFilters, setColumnFiltersState] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize });

  // Paginação controlada: mudar busca, filtro ou ordem volta para a página 1.
  // (O autoResetPageIndex da TanStack dispara um setState antes de montar.)
  const toFirstPage = () => setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
  const setSorting = (u: Updater<SortingState>) => {
    setSortingState(u);
    toFirstPage();
  };
  const setGlobalFilter = (u: Updater<string>) => {
    setGlobalFilterState(u);
    toFirstPage();
  };
  const setColumnFilters = (u: Updater<ColumnFiltersState>) => {
    setColumnFiltersState(u);
    toFirstPage();
  };
  const [columnVisibility, setColumnVisibility] = usePersistentState<VisibilityState>(
    storageKey && `${storageKey}:visibility`,
    {}
  );
  const [columnOrder, setColumnOrder] = usePersistentState<ColumnOrderState>(
    storageKey && `${storageKey}:order`,
    defaultOrder
  );

  // Se as colunas mudarem (deploy novo), descarta uma ordem salva incompatível.
  const safeOrder = React.useMemo(() => {
    const same =
      columnOrder.length === defaultOrder.length &&
      defaultOrder.every((id) => columnOrder.includes(id));
    return same ? columnOrder : defaultOrder;
  }, [columnOrder, defaultOrder]);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      columnOrder: safeOrder,
      pagination,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    globalFilterFn: "includesString",
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Se a lista encolher (ex.: exclusão), não deixa a página atual "sobrar" vazia.
  const pageCount = table.getPageCount();
  React.useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex > pageCount - 1) {
      setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
    }
  }, [pageCount, pagination.pageIndex]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumnOrder(() => {
      const from = safeOrder.indexOf(String(active.id));
      const to = safeOrder.indexOf(String(over.id));
      return arrayMove(safeOrder, from, to);
    });
  }

  const filterableColumns = table
    .getAllLeafColumns()
    .filter((c) => c.columnDef.meta?.filterOptions?.length);
  const hidableColumns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const isFiltered = !!globalFilter || columnFilters.length > 0;
  const layoutChanged =
    safeOrder.join() !== defaultOrder.join() ||
    Object.values(columnVisibility).some((v) => v === false);

  const visibleColumnIds = table.getVisibleLeafColumns().map((c) => c.id);
  const columnsIcon = useAnimatedIcon<AnimatedIconHandle>();
  const resetIcon = useAnimatedIcon<AnimatedIconHandle>();

  return (
    <div className={cn("space-y-3", className)}>
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          className="w-full sm:w-72"
          value={globalFilter}
          onChange={setGlobalFilter}
          label={`Buscar ${noun[1]}`}
        />
        <div className="flex flex-wrap items-center gap-2">
          {filterableColumns.map((column) => (
            <FacetFilter key={column.id} column={column} />
          ))}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setColumnFilters([]);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {hidableColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" {...columnsIcon.handlers}>
                  <SlidersHorizontalIcon ref={columnsIcon.ref} size={15} aria-hidden />
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Arraste o cabeçalho para reordenar
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hidableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
                {layoutChanged && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      {...resetIcon.handlers}
                      onSelect={() => {
                        setColumnOrder(defaultOrder);
                        setColumnVisibility({});
                      }}
                    >
                      <RotateCCWIcon ref={resetIcon.ref} size={15} aria-hidden />
                      Restaurar colunas
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {toolbarActions}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <DndContext
          id={storageKey ?? "data-table"}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  <SortableContext
                    items={visibleColumnIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    {group.headers.map((header) => (
                      <SortableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, rowIndex) => (
                  <TableRow
                    key={`skeleton-${rowIndex}`}
                    className="hover:bg-transparent"
                    aria-busy="true"
                  >
                    {visibleColumnIds.map((colId, colIndex) => {
                      const isFirst = colIndex === 0;
                      const isActions = colId === "actions";
                      const widthClass = isActions
                        ? "ml-auto h-8 w-16"
                        : isFirst
                          ? rowIndex % 2 === 0
                            ? "h-4 w-48 max-w-full"
                            : "h-4 w-36 max-w-full"
                          : colIndex % 2 === 1
                            ? "h-5 w-20"
                            : "h-4 w-24";
                      return (
                        <TableCell key={colId}>
                          <Skeleton className={widthClass} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <SortableCell key={cell.id} cell={cell} />
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={visibleColumnIds.length}
                    className="h-40 text-center text-sm text-muted-foreground"
                  >
                    {isFiltered
                      ? `Nenhum resultado para os filtros atuais.`
                      : emptyState ?? `Nenhum item cadastrado.`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <DataTablePagination table={table} noun={noun} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cabeçalho arrastável + ordenação                                     */
/* ------------------------------------------------------------------ */

function SortableHeader<TData>({ header }: { header: Header<TData, unknown> }) {
  const fixed = !!header.column.columnDef.meta?.fixed;
  const gripIcon = useAnimatedIcon<AnimatedIconHandle>();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: header.column.id, disabled: fixed });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 2 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const label = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext());

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      aria-sort={
        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
      }
      className={cn(
        "h-11 whitespace-nowrap",
        isDragging && "bg-muted shadow-md",
        header.column.columnDef.meta?.headerClassName
      )}
    >
      <div className="flex items-center gap-1">
        {!fixed && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            onMouseEnter={gripIcon.handlers.onMouseEnter}
            onMouseLeave={gripIcon.handlers.onMouseLeave}
            aria-label={`Mover coluna ${header.column.columnDef.meta?.label ?? header.column.id}`}
            className="-ml-1.5 flex size-6 cursor-grab items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVerticalIcon ref={gripIcon.ref} size={14} aria-hidden />
          </button>
        )}
        {canSort ? (
          <button
            type="button"
            onClick={header.column.getToggleSortingHandler()}
            className="-mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
            {sorted === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : sorted === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
            )}
          </button>
        ) : (
          <span className="font-medium">{label}</span>
        )}
      </div>
    </TableHead>
  );
}

function SortableCell<TData>({ cell }: { cell: Cell<TData, unknown> }) {
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: cell.column.id,
    disabled: !!cell.column.columnDef.meta?.fixed,
  });

  return (
    <TableCell
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
      }}
      className={cn(
        "py-3",
        isDragging && "bg-muted/60",
        cell.column.columnDef.meta?.cellClassName
      )}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}

/* ------------------------------------------------------------------ */
/* Filtro por valores                                                   */
/* ------------------------------------------------------------------ */

function FacetFilter<TData>({ column }: { column: Column<TData, unknown> }) {
  const options = column.columnDef.meta?.filterOptions ?? [];
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? []);
  const facets = column.getFacetedUniqueValues();

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    column.setFilterValue(next.size ? [...next] : undefined);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <ListFilter />
          {column.columnDef.meta?.label ?? column.id}
          {selected.size > 0 && (
            <span className="ml-0.5 rounded bg-primary px-1.5 py-px text-[0.7rem] font-medium tabular-nums text-primary-foreground">
              {selected.size}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.map((opt) => {
          const count = countFacet(facets, opt.value);
          return (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selected.has(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex-1 truncate">{opt.label}</span>
              <span className="ml-3 font-mono text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </DropdownMenuCheckboxItem>
          );
        })}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.setFilterValue(undefined)}>
              Limpar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Conta ocorrências de um valor, inclusive em colunas de array (tags). */
function countFacet(facets: Map<unknown, number>, value: string) {
  let total = 0;
  for (const [key, n] of facets) {
    if (Array.isArray(key) ? key.map(String).includes(value) : String(key) === value) {
      total += n;
    }
  }
  return total;
}
