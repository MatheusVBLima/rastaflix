"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllSeasons, fetchActiveSeason } from "@/lib/queries";
import { AwardSeason } from "@/lib/types";
import { AwardsPreviewContent } from "./AwardsPreviewContent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";

export function AwardsPreviewSidebar() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  // Buscar todas as temporadas para o dropdown
  const { data: allSeasons = [] } = useQuery<AwardSeason[]>({
    queryKey: ["seasons"],
    queryFn: fetchAllSeasons,
  });

  // Buscar temporada ativa para auto-seleção
  const { data: activeSeason } = useQuery<AwardSeason | null>({
    queryKey: ["activeSeason"],
    queryFn: fetchActiveSeason,
  });

  // Auto-selecionar temporada mais recente (ativa ou última criada) ao montar
  useEffect(() => {
    if (allSeasons.length > 0 && !selectedSeasonId) {
      // Prioriza temporada ativa, senão pega a primeira da lista (mais recente)
      const seasonToSelect = activeSeason || allSeasons[0];
      setSelectedSeasonId(seasonToSelect.id);
    }
  }, [allSeasons, activeSeason, selectedSeasonId]);

  return (
    <div className="space-y-6">
      {/* Alert de modo preview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Badge variant="secondary">Modo Preview</Badge>
          <span className="text-sm">
            Alterações salvam automaticamente e aparecem aqui em tempo real
          </span>
        </AlertDescription>
      </Alert>

      {/* Seletor de temporada com botão de fechar */}
      <div className="space-y-2">
        <label htmlFor="season-select" className="text-sm font-medium">
          Selecione a Temporada
        </label>
        <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
          <SelectTrigger id="season-select">
            <SelectValue placeholder="Escolha uma temporada..." />
          </SelectTrigger>
          <SelectContent>
            {allSeasons.map((season) => (
              <SelectItem key={season.id} value={season.id}>
                <div className="flex items-center gap-2">
                  <span>{season.title}</span>
                  <Badge
                    variant={
                      season.status === "active"
                        ? "default"
                        : season.status === "closed"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {season.status === "active" && "Ativa"}
                    {season.status === "closed" && "Encerrada"}
                    {season.status === "draft" && "Rascunho"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview da votação */}
      {selectedSeasonId ? (
        <AwardsPreviewContent seasonId={selectedSeasonId} />
      ) : (
        <div className="flex items-center justify-center p-12 text-center text-muted-foreground">
          <div>
            <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma temporada para visualizar o preview</p>
          </div>
        </div>
      )}
    </div>
  );
}
