"use client";

import {
  ViewTransition,
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import NumberFlow from "@number-flow/react";
import { Film, SearchX } from "lucide-react";
import { useDebouncedQueryState } from "@/hooks/use-debounced-query-state";
import { fetchClipes } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { Clipe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/layout/SearchField";
import { StickyFilterBar } from "@/components/layout/StickyFilterBar";
import { ShowMore } from "@/components/layout/ShowMore";
import { ClipCard } from "@/components/cards/ClipCard";
import { TwitchLogo } from "@/components/icons/TwitchLogo";
import { KickLogo } from "@/components/icons/KickLogo";
import { cn } from "@/lib/utils";

const PAGE = 24;

const PLATFORMS = ["all", "twitch", "kick"] as const;
type Platform = (typeof PLATFORMS)[number];

const TABS: { value: Platform; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "twitch", label: "Twitch" },
  { value: "kick", label: "Kick" },
];

export function Clipes() {
  const [searchTerm, setSearchTerm] = useDebouncedQueryState(
    "busca",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    300
  );
  const [platform, setPlatform] = useQueryState(
    "plataforma",
    parseAsStringLiteral(PLATFORMS)
      .withDefault("all")
      .withOptions({ clearOnDefault: true })
  );
  const [limit, setLimit] = useState(PAGE);

  const { data: clipes = [], error } = useQuery<Clipe[], Error>({
    queryKey: queryKeys.clipes.list(),
    queryFn: fetchClipes,
  });

  const search = useDeferredValue(searchTerm);

  const bySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? clipes.filter((c) => c.titulo.toLowerCase().includes(q)) : clipes;
  }, [clipes, search]);

  const counts = useMemo(
    () => ({
      all: bySearch.length,
      twitch: bySearch.filter((c) => c.plataforma === "twitch").length,
      kick: bySearch.filter((c) => c.plataforma === "kick").length,
    }),
    [bySearch]
  );

  const filtered = useMemo(
    () =>
      platform === "all" ? bySearch : bySearch.filter((c) => c.plataforma === platform),
    [bySearch, platform]
  );

  if (error) {
    return (
      <EmptyState title="Não foi possível carregar os clipes" description={error.message} />
    );
  }

  const hasFilters = !!searchTerm || platform !== "all";

  return (
    <div className="space-y-6">
      <StickyFilterBar>
        <SearchField
          value={searchTerm}
          onChange={(v) => {
            setLimit(PAGE);
            setSearchTerm(v);
          }}
          label="Buscar clipes"
          placeholder="Buscar pelo título"
        />

        {/* Plataforma: segmentado com contagem por aba */}
        <div
          role="tablist"
          aria-label="Plataforma"
          className="inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1 sm:ml-auto"
        >
          {TABS.map((tab) => {
            const active = platform === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() =>
                  startTransition(() => {
                    setLimit(PAGE);
                    setPlatform(tab.value);
                  })
                }
                className={cn(
                  "inline-flex h-full items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.value === "twitch" && <TwitchLogo className="h-3 w-auto" />}
                {tab.value === "kick" && <KickLogo className="h-3 w-auto" />}
                <span className={cn(tab.value !== "all" && "sr-only sm:not-sr-only")}>
                  {tab.label}
                </span>
                <NumberFlow
                  value={counts[tab.value]}
                  className="text-xs tabular-nums text-muted-foreground"
                />
              </button>
            );
          })}
        </div>
      </StickyFilterBar>

      {filtered.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum clipe com esses filtros"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setPlatform("all");
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Film} title="Nenhum clipe cadastrado" />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, limit).map((clipe, i) => (
              <ViewTransition
                key={clipe.id}
                enter="scale-in"
                exit="scale-out"
                update="auto"
                default="none"
              >
                <ClipCard clipe={clipe} priority={i < 3} />
              </ViewTransition>
            ))}
          </div>
          <ShowMore
            shown={Math.min(limit, filtered.length)}
            total={filtered.length}
            onMore={() => setLimit((l) => l + PAGE)}
          />
        </>
      )}
    </div>
  );
}
