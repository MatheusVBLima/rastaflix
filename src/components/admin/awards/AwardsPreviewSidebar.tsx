"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { fetchActiveSeason, fetchAllSeasons } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { AwardSeason } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AwardsPreviewContent } from "./AwardsPreviewContent";

const STATUS_LABEL: Record<AwardSeason["status"], string> = {
  active: "Votação aberta",
  closed: "Encerrada",
  draft: "Rascunho",
};

export function AwardsPreviewSidebar() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  const { data: allSeasons = [] } = useQuery<AwardSeason[]>({
    queryKey: queryKeys.rastaAwards.seasons(),
    queryFn: fetchAllSeasons,
  });

  const { data: activeSeason } = useQuery<AwardSeason | null>({
    queryKey: queryKeys.rastaAwards.activeSeason(),
    queryFn: fetchActiveSeason,
  });

  useEffect(() => {
    if (allSeasons.length === 0) return;
    if (selectedSeasonId && allSeasons.some((s) => s.id === selectedSeasonId)) return;
    const seasonToSelect = activeSeason ?? allSeasons[0];
    if (seasonToSelect) setSelectedSeasonId(seasonToSelect.id);
  }, [allSeasons, activeSeason, selectedSeasonId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="preview-season-select" className="text-sm font-medium">
            Temporada
          </label>
          <Select value={selectedSeasonId || undefined} onValueChange={setSelectedSeasonId}>
            <SelectTrigger id="preview-season-select" className="h-10 bg-background">
              <SelectValue placeholder="Escolha uma temporada" />
            </SelectTrigger>
            <SelectContent>
              {allSeasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  <span className="flex items-center gap-2">
                    <span>
                      {season.description
                        ? `${season.title} · ${season.description}`
                        : `${season.title} ${season.year}`}
                    </span>
                    <Badge
                      variant={
                        season.status === "active"
                          ? "default"
                          : season.status === "closed"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[11px]"
                    >
                      {STATUS_LABEL[season.status]}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSeasonId ? (
        <AwardsPreviewContent seasonId={selectedSeasonId} />
      ) : (
        <EmptyState
          icon={Award}
          title="Nenhuma temporada selecionada"
          description="Crie ou escolha uma temporada acima para visualizar o preview."
        />
      )}
    </div>
  );
}
