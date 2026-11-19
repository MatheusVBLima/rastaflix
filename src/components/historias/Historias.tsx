"use client";

import { ViewTransition, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { BookOpen, SearchX } from "lucide-react";
import { useDebouncedQueryState } from "@/hooks/use-debounced-query-state";
import { fetchHistorias } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { Story } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/layout/SearchField";
import { ResultCount } from "@/components/layout/ResultCount";
import { StickyFilterBar } from "@/components/layout/StickyFilterBar";
import { ShowMore } from "@/components/layout/ShowMore";
import { StoryCard } from "@/components/cards/StoryCard";

const PAGE = 24;

interface HistoriasProps {
  tags: string[];
}

export function Historias({ tags }: HistoriasProps) {
  const [searchTerm, setSearchTerm] = useDebouncedQueryState(
    "busca",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    300
  );
  const [selectedTag, setSelectedTag] = useQueryState(
    "tag",
    parseAsString.withDefault("todas").withOptions({ clearOnDefault: true })
  );
  const [limit, setLimit] = useState(PAGE);

  const { data: historias = [], error } = useQuery<Story[], Error>({
    queryKey: queryKeys.historias.list(),
    queryFn: fetchHistorias,
  });

  // Valores adiados: o filtro roda como transição e os cards animam (ViewTransition).
  const search = useDeferredValue(searchTerm);
  const tag = useDeferredValue(selectedTag);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return historias.filter((story) => {
      const matchesSearch =
        !q ||
        story.title.toLowerCase().includes(q) ||
        story.description?.toLowerCase().includes(q);
      const matchesTag = tag === "todas" || story.tags.includes(tag);
      return matchesSearch && matchesTag;
    });
  }, [historias, search, tag]);

  const hasFilters = !!searchTerm || selectedTag !== "todas";

  function clearFilters() {
    setSearchTerm("");
    setSelectedTag("todas");
  }

  function toggleTag(value: string) {
    setLimit(PAGE);
    setSelectedTag(selectedTag === value ? "todas" : value);
  }

  if (error) {
    return (
      <EmptyState
        title="Não foi possível carregar as histórias"
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
          label="Buscar histórias"
          placeholder="Buscar por título ou descrição"
        />
        <Select
          value={selectedTag}
          onValueChange={(v) => {
            setLimit(PAGE);
            setSelectedTag(v);
          }}
        >
          <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrar por tag">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>
                #{t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ResultCount
          shown={filtered.length}
          total={historias.length}
          noun={["história", "histórias"]}
          className="sm:ml-auto"
        />
      </StickyFilterBar>

      {filtered.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma história com esses filtros"
            action={
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState icon={BookOpen} title="Nenhuma história cadastrada" />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, limit).map((story, i) => (
              <ViewTransition
                key={story.id}
                enter="scale-in"
                exit="scale-out"
                update="auto"
                default="none"
              >
                <StoryCard
                  story={story}
                  priority={i < 3}
                  activeTag={selectedTag !== "todas" ? selectedTag : undefined}
                  onTagClick={toggleTag}
                />
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
