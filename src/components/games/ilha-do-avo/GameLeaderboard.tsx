"use client";

import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Skull, Timer, Trophy } from "lucide-react";
import { fetchGameLeaderboard } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import { GAME_SLUG } from "@/lib/games/ilha-do-avo/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatSurvivalTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function GameLeaderboard({ currentUserId }: { currentUserId?: string | null }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: queryKeys.games.leaderboard(GAME_SLUG),
    queryFn: () => fetchGameLeaderboard(GAME_SLUG, 15),
    staleTime: 60_000,
  });

  return (
    <section aria-labelledby="ranking-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Trophy className="size-5 text-primary" aria-hidden />
          <h2 id="ranking-title" className="font-display text-2xl font-semibold tracking-tight">
            Ranking Global da Ilha
          </h2>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          Top {Math.max(entries.length, 15)}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="size-7 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <Trophy className="size-8 text-muted-foreground/60" aria-hidden />
            <p className="font-medium">Nenhum recorde registrado ainda</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Entre com sua conta e jogue uma partida na Ilha do Avô Romeno para inaugurar o ranking!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="w-12 px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Jogador</th>
                  <th className="px-4 py-2.5 text-right">Pontos</th>
                  <th className="hidden px-4 py-2.5 text-right sm:table-cell">Tempo</th>
                  <th className="hidden px-4 py-2.5 text-right md:table-cell">Abates</th>
                  <th className="hidden px-4 py-2.5 text-right md:table-cell">Nível</th>
                  <th className="hidden px-4 py-2.5 text-right lg:table-cell">Morango</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = currentUserId && entry.user_id === currentUserId;
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "transition-colors hover:bg-muted/30",
                        isMe && "bg-primary/5"
                      )}
                    >
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {rank === 1 ? (
                          <Crown className="size-4 text-yellow-500" aria-label="1º lugar" />
                        ) : rank === 2 ? (
                          <Medal className="size-4 text-slate-400" aria-label="2º lugar" />
                        ) : rank === 3 ? (
                          <Medal className="size-4 text-amber-600" aria-label="3º lugar" />
                        ) : (
                          <span className="text-muted-foreground">{rank}º</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            {entry.player_avatar && (
                              <AvatarImage src={entry.player_avatar} alt={entry.player_name} />
                            )}
                            <AvatarFallback className="text-xs">
                              {entry.player_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="block truncate font-medium">
                              {entry.player_name}
                              {isMe && (
                                <span className="ml-1.5 text-xs text-primary">(você)</span>
                              )}
                            </span>
                            {entry.weapons_used.length > 0 && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {entry.weapons_used.slice(0, 3).join(" • ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-display text-base font-semibold tabular-nums">
                        {entry.score.toLocaleString("pt-BR")}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Timer className="size-3.5" aria-hidden />
                          {formatSurvivalTime(entry.survival_seconds)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Skull className="size-3.5" aria-hidden />
                          {entry.kills}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">
                        Nv.{entry.level_reached}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground lg:table-cell">
                        {entry.bosses_defeated > 0 ? `${entry.bosses_defeated}×` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
