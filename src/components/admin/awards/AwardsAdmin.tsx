"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deleteCategory, deleteNominee, deleteSeason } from "@/actions/awardActions";
import {
  fetchAllCategoriesWithResults,
  fetchAllSeasons,
  fetchCategoriesBySeason,
  fetchNomineesByCategory,
} from "@/lib/queries";
import type { AwardCategory, AwardNominee, AwardSeason, CategoryWithResults } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTable } from "@/components/admin/AdminTable";
import { ResultsCategory } from "@/components/awards/RastaAwardsVoting";
import { categoryColumns, nomineeColumns, seasonColumns } from "./columns";
import { awardKeys, CategoryForm, NomineeForm, SeasonForm } from "./forms";

const seasonLabel = (s: AwardSeason) => (s.description ? `${s.title} · ${s.description}` : `${s.title} ${s.year}`);
const categoryLabel = (c: AwardCategory) => c.name;
const nomineeLabel = (n: AwardNominee) => n.title;

/**
 * Gestão do Rasta Awards. A temporada e a categoria escolhidas valem para
 * todas as abas, então dá para criar categorias e indicados sem reescolher.
 */
export function AwardsAdmin() {
  const { data: seasons = [], isLoading: loadingSeasons } = useQuery<AwardSeason[]>({
    queryKey: awardKeys.seasons(),
    queryFn: fetchAllSeasons,
  });

  const [seasonId, setSeasonId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Padrão: a temporada com votação aberta, senão a mais recente.
  useEffect(() => {
    if (seasonId && seasons.some((s) => s.id === seasonId)) return;
    const pick = seasons.find((s) => s.status === "active") ?? [...seasons].sort((a, b) => b.year - a.year)[0];
    if (pick) setSeasonId(pick.id);
  }, [seasons, seasonId]);

  const { data: categories = [] } = useQuery<AwardCategory[]>({
    queryKey: awardKeys.categories(seasonId),
    queryFn: () => fetchCategoriesBySeason(seasonId),
    enabled: !!seasonId,
  });

  useEffect(() => {
    if (categoryId && categories.some((c) => c.id === categoryId)) return;
    setCategoryId(categories[0]?.id ?? "");
  }, [categories, categoryId]);

  const nextCategoryOrder = useMemo(
    () => Math.max(0, ...categories.map((c) => c.display_order)) + 1,
    [categories]
  );

  return (
    <Tabs defaultValue="temporadas" className="gap-6">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="temporadas" className="px-4">Temporadas</TabsTrigger>
        <TabsTrigger value="categorias" className="px-4">Categorias</TabsTrigger>
        <TabsTrigger value="indicados" className="px-4">Indicados</TabsTrigger>
        <TabsTrigger value="resultados" className="px-4">Resultados</TabsTrigger>
      </TabsList>

      <TabsContent value="temporadas">
        <AdminTable<AwardSeason>
          queryKey={awardKeys.seasons()}
          queryFn={fetchAllSeasons}
          columns={seasonColumns}
          noun={["temporada", "temporadas"]}
          gender="f"
          getLabel={seasonLabel}
          onDelete={deleteSeason}
          renderForm={(p) => <SeasonForm {...p} />}
          storageKey="rastaflix:admin:awards:temporadas"
        />
      </TabsContent>

      <TabsContent value="categorias" className="space-y-4">
        <SeasonPicker seasons={seasons} value={seasonId} onChange={setSeasonId} loading={loadingSeasons} />
        {seasonId ? (
          <AdminTable<AwardCategory>
            key={seasonId}
            queryKey={awardKeys.categories(seasonId)}
            queryFn={() => fetchCategoriesBySeason(seasonId)}
            columns={categoryColumns}
            noun={["categoria", "categorias"]}
            gender="f"
            getLabel={categoryLabel}
            onDelete={deleteCategory}
            renderForm={(p) => <CategoryForm {...p} seasonId={seasonId} nextOrder={nextCategoryOrder} />}
            storageKey="rastaflix:admin:awards:categorias"
          />
        ) : (
          <EmptyState title="Crie uma temporada primeiro" />
        )}
      </TabsContent>

      <TabsContent value="indicados" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SeasonPicker seasons={seasons} value={seasonId} onChange={setSeasonId} loading={loadingSeasons} />
          <Picker
            label="Categoria"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder={seasonId ? "Sem categorias" : "Escolha a temporada"}
          />
        </div>
        {categoryId ? (
          <NomineesTable key={categoryId} categoryId={categoryId} seasonId={seasonId} />
        ) : (
          <EmptyState title="Crie uma categoria nesta temporada primeiro" />
        )}
      </TabsContent>

      <TabsContent value="resultados" className="space-y-4">
        <SeasonPicker seasons={seasons} value={seasonId} onChange={setSeasonId} loading={loadingSeasons} />
        {seasonId && <Results seasonId={seasonId} />}
      </TabsContent>
    </Tabs>
  );
}

function NomineesTable({ categoryId, seasonId }: { categoryId: string; seasonId: string }) {
  const { data: nominees = [] } = useQuery<AwardNominee[]>({
    queryKey: awardKeys.nominees(categoryId),
    queryFn: () => fetchNomineesByCategory(categoryId),
  });
  const nextOrder = Math.max(0, ...nominees.map((n) => n.display_order)) + 1;

  return (
    <AdminTable<AwardNominee>
      queryKey={awardKeys.nominees(categoryId)}
      queryFn={() => fetchNomineesByCategory(categoryId)}
      columns={nomineeColumns}
      noun={["indicado", "indicados"]}
      getLabel={nomineeLabel}
      onDelete={deleteNominee}
      renderForm={(p) => (
        <NomineeForm {...p} categoryId={categoryId} seasonId={seasonId} nextOrder={nextOrder} />
      )}
      storageKey="rastaflix:admin:awards:indicados"
    />
  );
}

function AwardsResultsSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Carregando resultados"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-4">
                  <Skeleton className={j === 0 ? "h-4 w-40" : "h-4 w-32"} />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Results({ seasonId }: { seasonId: string }) {
  const { data = [], isLoading } = useQuery<CategoryWithResults[]>({
    queryKey: ["results", seasonId],
    queryFn: () => fetchAllCategoriesWithResults(seasonId),
  });

  if (isLoading) return <AwardsResultsSkeleton />;
  if (data.length === 0) return <EmptyState title="Nenhuma categoria nesta temporada" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {data.map((category) => (
        <ResultsCategory key={category.id} category={category} />
      ))}
    </div>
  );
}

function SeasonPicker({
  seasons,
  value,
  onChange,
  loading,
}: {
  seasons: AwardSeason[];
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
}) {
  return (
    <Picker
      label="Temporada"
      value={value}
      onChange={onChange}
      placeholder={loading ? "Carregando" : "Nenhuma temporada"}
      options={seasons.map((s) => ({
        value: s.id,
        label: `${seasonLabel(s)}${s.status === "active" ? " (aberta)" : ""}`,
      }))}
    />
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:w-72">
      <span className="text-sm font-medium" id={`picker-${label}`}>
        {label}
      </span>
      <Select value={value || undefined} onValueChange={onChange} disabled={options.length === 0}>
        <SelectTrigger aria-labelledby={`picker-${label}`} className="h-10 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
