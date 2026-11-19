"use client";

import { ViewTransition, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString } from "nuqs";
import { Mic, SearchX } from "lucide-react";
import { useDebouncedQueryState } from "@/hooks/use-debounced-query-state";
import { fetchEsculachos } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { Esculacho } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/layout/SearchField";
import { ResultCount } from "@/components/layout/ResultCount";
import { StickyFilterBar } from "@/components/layout/StickyFilterBar";
import { ShowMore } from "@/components/layout/ShowMore";
import { EsculachoCard } from "@/components/cards/EsculachoCard";

const PAGE = 12;

export function Esculachos() {
  const [searchTerm, setSearchTerm] = useDebouncedQueryState(
    "busca",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    300
  );
  const [limit, setLimit] = useState(PAGE);

  const { data: esculachos = [], error } = useQuery<Esculacho[], Error>({
    queryKey: queryKeys.esculachos.list(),
    queryFn: fetchEsculachos,
  });

  const search = useDeferredValue(searchTerm);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return esculachos;
    return esculachos.filter((e) =>
      [e.titulo, e.descricao, e.conteudo, e.autor].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [esculachos, search]);

  if (error) {
    return (
      <EmptyState
        title="Não foi possível carregar os esculachos"
        description={error.message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StickyFilterBar>
        <SearchField
          value={searchTerm}
          onChange={(v) => {
            setLimit(PAGE);
            setSearchTerm(v);
          }}
          label="Buscar esculachos"
          placeholder="Buscar no texto, título ou autor"
        />
        <ResultCount
          shown={filtered.length}
          total={esculachos.length}
          noun={["esculacho", "esculachos"]}
          className="sm:ml-auto"
        />
      </StickyFilterBar>

      {filtered.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={SearchX}
            title={`Nenhum esculacho com “${searchTerm}”`}
            action={
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar busca
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Mic} title="Nenhum esculacho cadastrado" />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filtered.slice(0, limit).map((esculacho) => (
              <ViewTransition
                key={esculacho.id}
                enter="scale-in"
                exit="scale-out"
                update="auto"
                default="none"
              >
                <EsculachoCard esculacho={esculacho} />
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
