"use client";

import { ViewTransition, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString } from "nuqs";
import { Music2, SearchX } from "lucide-react";
import { useDebouncedQueryState } from "@/hooks/use-debounced-query-state";
import { fetchMusicas } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { Music } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/layout/SearchField";
import { ResultCount } from "@/components/layout/ResultCount";
import { StickyFilterBar } from "@/components/layout/StickyFilterBar";
import { ShowMore } from "@/components/layout/ShowMore";
import { MusicCard } from "@/components/cards/MusicCard";

const PAGE = 24;

export function Musicas() {
  const [searchTerm, setSearchTerm] = useDebouncedQueryState(
    "busca",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    300
  );
  const [limit, setLimit] = useState(PAGE);

  const { data: musicas = [], error } = useQuery<Music[], Error>({
    queryKey: queryKeys.musicas.list(),
    queryFn: fetchMusicas,
  });

  const search = useDeferredValue(searchTerm);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? musicas.filter((m) => m.title.toLowerCase().includes(q)) : musicas;
  }, [musicas, search]);

  if (error) {
    return (
      <EmptyState
        title="Não foi possível carregar as músicas"
        description={error.message}
      />
    );
  }

  return (
    <div className="space-y-8">
      <StickyFilterBar>
        <SearchField
          value={searchTerm}
          onChange={(v) => {
            setLimit(PAGE);
            setSearchTerm(v);
          }}
          label="Buscar músicas"
          placeholder="Buscar pelo nome"
        />
        <ResultCount
          shown={filtered.length}
          total={musicas.length}
          noun={["música", "músicas"]}
          className="sm:ml-auto"
        />
      </StickyFilterBar>

      {filtered.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={SearchX}
            title={`Nenhuma música com “${searchTerm}”`}
            action={
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar busca
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Music2} title="Nenhuma música cadastrada" />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {filtered.slice(0, limit).map((music, i) => (
              <ViewTransition
                key={music.id}
                enter="scale-in"
                exit="scale-out"
                update="auto"
                default="none"
              >
                <MusicCard music={music} priority={i < 4} />
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
