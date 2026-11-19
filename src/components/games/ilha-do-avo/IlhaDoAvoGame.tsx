"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Compass,
  Crown,
  Flame,
  Heart,
  MapPin,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Skull,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { submitGameScore } from "@/actions/gameScoreActions";
import { IlhaDoAvoEngine } from "@/lib/games/ilha-do-avo/engine";
import {
  ENEMY_ARCHETYPES,
  MAP_DEFINITIONS,
  MAP_LIST,
  WEAPON_LIST,
} from "@/lib/games/ilha-do-avo/content";
import { GAME_SLUG, type HudSnapshot, type MapId } from "@/lib/games/ilha-do-avo/types";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VirtualJoystick } from "./VirtualJoystick";
import { GameLeaderboard } from "./GameLeaderboard";

const LOCAL_BEST_KEY = "rastaflix_ilha_do_avo_best_score";

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function IlhaDoAvoGame() {
  const { user, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<IlhaDoAvoEngine | null>(null);
  const submittedSeedRef = useRef<number | null>(null);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapId>("ilha_avo_romeno");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localBest, setLocalBest] = useState<number>(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(LOCAL_BEST_KEY) ?? "0");
      if (Number.isFinite(saved) && saved > 0) setLocalBest(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const engine = new IlhaDoAvoEngine(host, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Auto-salva pontuação ao encerrar a run (gameover ou vitória final)
  useEffect(() => {
    if (!hud || (hud.phase !== "gameover" && hud.phase !== "victory") || !hud.summary) return;
    const summary = hud.summary;
    const submissionKey = summary.seed + (summary.victory ? 1 : 0);
    if (submittedSeedRef.current === submissionKey) return;
    submittedSeedRef.current = submissionKey;

    setLocalBest((prev) => {
      const next = Math.max(prev, summary.score);
      try {
        localStorage.setItem(LOCAL_BEST_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });

    if (!isSignedIn) {
      setSaveState("idle");
      setSaveMessage("");
      return;
    }

    setSaveState("saving");
    void submitGameScore({
      gameSlug: GAME_SLUG,
      score: summary.score,
      kills: summary.kills,
      levelReached: summary.level,
      survivalSeconds: summary.survivalSeconds,
      bossesDefeated: summary.bossesDefeated,
      weaponsUsed: summary.weaponsUsed,
      seed: summary.seed,
    }).then((res) => {
      if (res.success) {
        setSaveState("saved");
        setSaveMessage(res.message ?? "Pontuação salva no ranking!");
        if (res.isNewPersonalBest) {
          toast.success("Novo recorde pessoal no ranking!");
        }
        void queryClient.invalidateQueries({
          queryKey: queryKeys.games.leaderboard(GAME_SLUG),
        });
      } else {
        setSaveState("error");
        setSaveMessage(res.message ?? "Não foi possível salvar no ranking.");
      }
    });
  }, [hud, isSignedIn, queryClient]);

  const handleSelectMap = useCallback((mapId: MapId) => {
    setSelectedMap(mapId);
    engineRef.current?.selectMap(mapId);
  }, []);

  const handleStart = useCallback(
    (overrideMapId?: MapId) => {
      submittedSeedRef.current = null;
      setSaveState("idle");
      setSaveMessage("");
      const target = overrideMapId ?? selectedMap;
      setSelectedMap(target);
      engineRef.current?.startNewRun(target);
    },
    [selectedMap]
  );

  const handleJoystickMove = useCallback((dx: number, dz: number) => {
    engineRef.current?.setVirtualMove(dx, dz);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* navegador sem suporte */
    }
  }, []);

  const hpPct = hud ? Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100)) : 100;
  const xpPct = hud ? Math.max(0, Math.min(100, (hud.xp / Math.max(1, hud.xpToNext)) * 100)) : 0;
  const activeMapDef = MAP_DEFINITIONS[hud?.mapId ?? selectedMap];

  return (
    <div className="space-y-10">
      {/* Arena 3D + HUD */}
      <div
        ref={stageRef}
        className={cn(
          "relative overflow-hidden border bg-black shadow-2xl select-none",
          isFullscreen
            ? "h-screen w-screen rounded-none border-0"
            : "h-[76vh] min-h-[540px] max-h-[840px] w-full rounded-2xl"
        )}
      >
        {/* Canvas WebGL Three.js */}
        <div ref={canvasHostRef} className="absolute inset-0 h-full w-full" />

        {/* Números de dano flutuantes */}
        {hud && hud.phase === "playing" && hud.damageNumbers.length > 0 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {hud.damageNumbers.map((d) => (
              <span
                key={d.id}
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  opacity: d.alpha,
                  transform: "translate(-50%, -50%)",
                }}
                className={cn(
                  "absolute font-display text-sm font-bold tabular-nums drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]",
                  d.kind === "crit" && "text-base text-yellow-300",
                  d.kind === "heal" && "text-base text-sky-300",
                  d.kind === "player" && "text-base text-rose-400",
                  d.kind === "normal" && "text-white"
                )}
              >
                {d.text}
              </span>
            ))}
          </div>
        )}

        {/* HUD durante Gameplay */}
        {hud && hud.phase !== "title" && (
          <>
            {/* Barra de XP fina no topo absoluto */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-2 bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-yellow-300 transition-[width] duration-150"
                style={{ width: `${xpPct}%` }}
              />
            </div>

            {/* Zona Superior da HUD */}
            <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex items-start justify-between gap-2 px-3 sm:px-4">
              {/* Esquerda: HP + Nível + Armas */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/65 px-2.5 py-1.5 text-white backdrop-blur-md">
                  <span className="flex size-7 items-center justify-center rounded-md bg-white font-display text-xs font-bold text-black tabular-nums">
                    {hud.level}
                  </span>
                  <div className="w-32 sm:w-40">
                    <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold">
                      <span className="inline-flex items-center gap-1 text-rose-300">
                        <Heart className="size-3 fill-rose-500 text-rose-500" aria-hidden />
                        HP
                      </span>
                      <span className="tabular-nums">
                        {hud.hp}/{hud.maxHp}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/15">
                      <div
                        className={cn(
                          "h-full transition-[width] duration-150",
                          hpPct > 45
                            ? "bg-emerald-400"
                            : hpPct > 22
                              ? "bg-amber-400"
                              : "bg-rose-500"
                        )}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {hud.redBullBoostRemaining > 0 && (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-sky-400/50 bg-sky-500/25 px-2 py-0.5 text-xs font-semibold text-sky-200 backdrop-blur-sm">
                    <Zap className="size-3.5 fill-sky-300 text-sky-300" aria-hidden />
                    Red Bull <span className="tabular-nums">{hud.redBullBoostRemaining.toFixed(1)}s</span>
                  </div>
                )}

                <div className="hidden max-w-xs flex-wrap gap-1 sm:flex">
                  {hud.weapons.map((w) => (
                    <span
                      key={w.id}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: w.color }}
                      />
                      {w.shortName}
                      <span className="text-yellow-300 tabular-nums">Nv.{w.level}</span>
                    </span>
                  ))}
                  {hud.passives.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur-sm"
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.shortName}
                      <span className="text-sky-300 tabular-nums">{p.level}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Centro: Fase atual + Cronômetro + Boss + Portal */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-white/15 bg-black/70 px-3 py-1 text-white backdrop-blur-md">
                  <span className="hidden items-center gap-1 text-xs font-medium text-white/80 sm:inline-flex">
                    <MapPin className="size-3.5" aria-hidden />
                    {hud.mapOrder}/{hud.totalMaps} {hud.mapName}
                  </span>
                  <span className="hidden h-4 w-px bg-white/20 sm:block" />
                  <span className="font-display text-lg font-bold tracking-tight tabular-nums sm:text-xl">
                    {formatClock(hud.elapsedSeconds)}
                  </span>
                  {hud.bossCountdownSeconds !== null && hud.bossCountdownSeconds > 0 && (
                    <>
                      <span className="h-4 w-px bg-white/20" />
                      <span className="text-[11px] font-semibold text-amber-300 tabular-nums">
                        {activeMapDef.isFinalStage ? "Morango" : "Chefe"} em{" "}
                        {formatClock(hud.bossCountdownSeconds)}
                      </span>
                    </>
                  )}
                </div>

                {/* Barra de HP do Boss da Fase / Boss Final Morango */}
                {hud.boss && (
                  <div
                    className={cn(
                      "w-56 rounded-lg border bg-black/85 px-3 py-1.5 text-white shadow-lg backdrop-blur-md sm:w-80",
                      hud.boss.isFinalBoss ? "border-rose-500/80" : "border-amber-400/70"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs font-bold">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          hud.boss.isFinalBoss ? "text-rose-300" : "text-amber-300"
                        )}
                      >
                        <Crown className="size-3.5" aria-hidden />
                        {hud.boss.name.toUpperCase()}
                      </span>
                      <span className="tabular-nums text-white/80">
                        {hud.boss.hp}/{hud.boss.maxHp}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                      <div
                        className={cn(
                          "h-full transition-[width] duration-150",
                          hud.boss.isFinalBoss
                            ? "bg-gradient-to-r from-rose-600 via-pink-500 to-rose-400"
                            : "bg-gradient-to-r from-amber-500 to-yellow-300"
                        )}
                        style={{
                          width: `${Math.max(0, Math.min(100, (hud.boss.hp / Math.max(1, hud.boss.maxHp)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Botão/Aviso de Portal Aberto para a próxima cidade */}
                {hud.portal && hud.phase === "playing" && (
                  <button
                    type="button"
                    onClick={() => engineRef.current?.advanceToNextMap()}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-sky-400/70 bg-sky-950/90 px-3.5 py-1.5 text-xs font-semibold text-sky-100 shadow-lg backdrop-blur-md transition hover:bg-sky-900"
                  >
                    <Compass className="size-4 text-sky-300" aria-hidden />
                    Portal para {hud.portal.targetMapName} ({hud.portal.distance}m) — Clique ou aperte E
                    <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                )}

                {/* Banner breve */}
                {hud.banner && (
                  <div
                    key={hud.banner.id}
                    className={cn(
                      "rounded-md border px-3 py-1 text-xs font-bold tracking-wide shadow-lg backdrop-blur-md sm:text-sm",
                      hud.banner.tone === "boss" &&
                        "border-rose-400/70 bg-rose-950/85 text-rose-100",
                      hud.banner.tone === "pickup" &&
                        "border-sky-400/60 bg-sky-950/85 text-sky-100",
                      hud.banner.tone === "wave" &&
                        "border-white/25 bg-black/80 text-white",
                      hud.banner.tone === "info" &&
                        "border-white/20 bg-black/75 text-white"
                    )}
                  >
                    {hud.banner.text}
                  </div>
                )}
              </div>

              {/* Direita: Score, Kills, Contagem de Mobs e Ações */}
              <div className="pointer-events-auto flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-black/65 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                    <span className="font-display text-sm font-bold text-white tabular-nums">
                      {hud.score.toLocaleString("pt-BR")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-white/80 tabular-nums">
                      <Skull className="size-3.5 text-rose-400" aria-hidden />
                      {hud.kills}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => engineRef.current?.toggleMute()}
                    aria-label={hud.muted ? "Ativar som" : "Silenciar som"}
                    className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-black/65 text-white backdrop-blur-md transition hover:bg-black/85"
                  >
                    {hud.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleFullscreen()}
                    aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                    className="hidden size-8 items-center justify-center rounded-lg border border-white/15 bg-black/65 text-white backdrop-blur-md transition hover:bg-black/85 sm:flex"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => engineRef.current?.togglePause()}
                    aria-label={hud.phase === "paused" ? "Continuar" : "Pausar"}
                    className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-black/65 text-white backdrop-blur-md transition hover:bg-black/85"
                  >
                    {hud.phase === "paused" ? (
                      <Play className="size-4" />
                    ) : (
                      <Pause className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Minimapa Radar no canto inferior direito (essencial em mapas grandes estilo Vampire Survivors!) */}
            {hud.phase === "playing" && (
              <div className="pointer-events-none absolute right-3 bottom-3 z-20 hidden flex-col items-end gap-1 sm:flex">
                <div className="relative size-28 overflow-hidden rounded-full border border-white/25 bg-black/65 shadow-lg backdrop-blur-md">
                  {/* Cruz guia */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />

                  {/* Marcadores: marcos da cidade, Red Bull, Boss e Portal */}
                  {hud.minimap.markers.map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        left: `${50 + m.nx * 44}%`,
                        top: `${50 + m.nz * 44}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={cn(
                        "absolute rounded-full",
                        m.kind === "landmark" && "size-1.5 bg-white/45",
                        m.kind === "redbull" && "size-2 bg-sky-400 shadow-[0_0_6px_#38bdf8]",
                        m.kind === "boss" && "size-3 animate-pulse bg-rose-500 ring-2 ring-rose-300",
                        m.kind === "portal" && "size-3 animate-pulse bg-yellow-300 ring-2 ring-sky-400"
                      )}
                    />
                  ))}

                  {/* Jogador (Ovelhera) */}
                  <span
                    style={{
                      left: `${50 + hud.minimap.playerNx * 44}%`,
                      top: `${50 + hud.minimap.playerNz * 44}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute size-2.5 rounded-full bg-yellow-300 ring-2 ring-white"
                  />
                </div>
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/75 tabular-nums">
                  {hud.enemyCount} inimigos ativos
                </span>
              </div>
            )}

            {/* Controles Touch (Mobile) */}
            {hud.phase === "playing" && (
              <div className="absolute bottom-5 left-5 z-20">
                <VirtualJoystick onMove={handleJoystickMove} />
              </div>
            )}
          </>
        )}

        {/* Overlay: Tela Inicial + Seletor dos 5 Mapas ao Vivo */}
        {(!hud || hud.phase === "title") && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-between bg-gradient-to-t from-black/90 via-black/15 to-black/35 p-4 text-center text-white sm:p-6">
            <div className="flex w-full items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                <MapPin className="size-3.5" aria-hidden />
                {activeMapDef.subtitle} • {activeMapDef.stateLabel}
              </span>
              {localBest > 0 && (
                <span className="rounded-md border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 tabular-nums backdrop-blur-md">
                  Recorde: <strong className="text-white">{localBest.toLocaleString("pt-BR")}</strong>
                </span>
              )}
            </div>

            <div className="w-full max-w-3xl space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75 drop-shadow">
                  Ovelhera Survivors
                </p>
                <h2 className="font-display text-3xl font-bold tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)] sm:text-5xl">
                  {activeMapDef.name}
                </h2>
                <p className="mx-auto max-w-xl text-xs text-white/85 drop-shadow sm:text-sm">
                  {activeMapDef.description}
                </p>
              </div>

              {/* Seletor das 5 Fases (troca o mapa 3D ao vivo!) */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                {MAP_LIST.map((map) => {
                  const active = (hud?.mapId ?? selectedMap) === map.id;
                  return (
                    <button
                      key={map.id}
                      type="button"
                      onClick={() => handleSelectMap(map.id)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition backdrop-blur-md",
                        active
                          ? "border-white bg-white/20 text-white shadow-md"
                          : "border-white/15 bg-black/55 text-white/75 hover:border-white/40 hover:bg-black/75 hover:text-white"
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/65">
                        {map.isFinalStage ? "Fase Final" : `Fase ${map.order}`}
                      </span>
                      <span className="truncate text-xs font-semibold">{map.name}</span>
                      <span className="truncate text-[10px] text-white/60">
                        {map.isFinalStage ? "Boss: Morango" : map.stateLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => handleStart()}
                  className="h-11 px-7 font-display text-base font-semibold shadow-lg"
                >
                  <Play className="mr-2 size-4 fill-current" aria-hidden />
                  Jogar em {activeMapDef.name}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => void toggleFullscreen()}
                  className="h-11 border-white/25 bg-black/55 text-white backdrop-blur-md hover:bg-black/80 hover:text-white"
                >
                  <Maximize2 className="mr-2 size-4" aria-hidden />
                  Tela Cheia
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-white/70">
                <span>WASD / Setas para mover</span>
                <span>•</span>
                <span>ESC / P para pausar</span>
                <span>•</span>
                <span>Derrote o chefe para abrir o portal da próxima cidade</span>
              </div>
            </div>
          </div>
        )}

        {/* Overlay: Level-Up */}
        {hud && hud.phase === "levelup" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl space-y-4">
              <div className="text-center text-white">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                  Subiu para o Nível {hud.level}
                </p>
                <h3 className="font-display text-2xl font-bold sm:text-3xl">
                  Escolha um Upgrade
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {hud.upgradeChoices.map((choice, idx) => (
                  <button
                    key={`${choice.kind}-${choice.id}`}
                    type="button"
                    onClick={() => engineRef.current?.selectUpgrade(idx)}
                    className="group relative flex flex-col justify-between gap-3 rounded-xl border border-white/15 bg-zinc-950/90 p-4 text-left text-white transition hover:-translate-y-1 hover:border-white/70 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                      style={{ backgroundColor: choice.color }}
                    />
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                          {choice.kind === "weapon" ? "Arma" : "Passiva"}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                            choice.isNew
                              ? "bg-white text-black"
                              : "bg-emerald-500/25 text-emerald-300"
                          )}
                        >
                          {choice.isNew
                            ? "NOVO!"
                            : `Nv.${choice.currentLevel} → ${choice.nextLevel}`}
                        </span>
                      </div>

                      <h4 className="font-display text-lg font-bold leading-tight">
                        {choice.name}
                      </h4>
                      <p className="text-xs leading-relaxed text-zinc-300">
                        {choice.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-zinc-400">
                      <span>Clique ou tecla</span>
                      <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-semibold text-white">
                        {idx + 1}
                      </kbd>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overlay: Pause */}
        {hud && hud.phase === "paused" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm space-y-5 rounded-xl border border-white/15 bg-zinc-950/95 p-6 text-white shadow-2xl">
              <div className="space-y-1 text-center">
                <h3 className="font-display text-2xl font-bold">Jogo Pausado</h3>
                <p className="text-xs text-zinc-400">
                  {hud.mapName} • Tempo {formatClock(hud.elapsedSeconds)} • Seed #{hud.seed}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button size="lg" onClick={() => engineRef.current?.togglePause()}>
                  <Play className="mr-2 size-4 fill-current" aria-hidden />
                  Continuar
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => engineRef.current?.toggleMute()}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    {hud.muted ? (
                      <>
                        <VolumeX className="mr-1.5 size-4" aria-hidden /> Som: Off
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-1.5 size-4" aria-hidden /> Som: On
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      engineRef.current?.setQuality(hud.quality === "high" ? "low" : "high")
                    }
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    Gráfico: {hud.quality === "high" ? "Alto" : "Leve"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleStart(hud.mapId)}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="mr-2 size-4" aria-hidden />
                  Reiniciar Fase
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => engineRef.current?.returnToTitle()}
                  className="text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Escolher outro mapa
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay: Vitória Final (Morango derrotada em São Luís!) */}
        {hud && hud.phase === "victory" && hud.summary && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-5 rounded-xl border border-emerald-400/40 bg-zinc-950/95 p-6 text-white shadow-2xl">
              <div className="space-y-1 text-center">
                <Trophy className="mx-auto size-9 text-yellow-400" aria-hidden />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Campanha Concluída em São Luís!
                </p>
                <h3 className="font-display text-3xl font-bold">
                  Morango Derrotada!
                </h3>
                <p className="text-sm text-zinc-300">
                  Pontuação atual:{" "}
                  <strong className="text-white tabular-nums">
                    {hud.summary.score.toLocaleString("pt-BR")} pts
                  </strong>
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs">
                {isSignedIn
                  ? saveState === "saved"
                    ? saveMessage
                    : "Registrando vitória no ranking global..."
                  : "Entre na conta para registrar sua vitória no ranking global."}
              </div>

              <div className="flex flex-col gap-2.5">
                <Button
                  size="lg"
                  onClick={() => engineRef.current?.continueEndlessAfterVictory()}
                >
                  <Flame className="mr-2 size-4" aria-hidden />
                  Continuar no Modo Infinito (São Luís)
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => engineRef.current?.finishRunFromVictory()}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Encerrar e ver resumo final
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay: Game Over */}
        {hud && hud.phase === "gameover" && hud.summary && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md space-y-5 rounded-xl border border-white/15 bg-zinc-950/95 p-6 text-white shadow-2xl">
              <div className="space-y-1 text-center">
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.2em]",
                    hud.summary.victory ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {hud.summary.victory ? "Vitória na Campanha" : `Fim de Live • ${hud.summary.mapName}`}
                </p>
                <h3 className="font-display text-3xl font-bold tabular-nums">
                  {hud.summary.score.toLocaleString("pt-BR")} pts
                </h3>
                <p className="text-xs text-zinc-400">
                  {hud.summary.victory ? (
                    "Você sobreviveu até derrotar a Morango em São Luís!"
                  ) : (
                    <>
                      Derrotado por{" "}
                      <strong className="text-zinc-200">{hud.summary.defeatedBy}</strong>
                    </>
                  )}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <dt className="text-[11px] text-zinc-400">Tempo</dt>
                  <dd className="font-display text-lg font-bold tabular-nums">
                    {formatClock(hud.summary.survivalSeconds)}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <dt className="text-[11px] text-zinc-400">Abates</dt>
                  <dd className="font-display text-lg font-bold tabular-nums">
                    {hud.summary.kills}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <dt className="text-[11px] text-zinc-400">Nível</dt>
                  <dd className="font-display text-lg font-bold tabular-nums">
                    {hud.summary.level}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <dt className="text-[11px] text-zinc-400">Chefes</dt>
                  <dd className="font-display text-lg font-bold tabular-nums">
                    {hud.summary.bossesDefeated}×
                  </dd>
                </div>
              </dl>

              {hud.summary.weaponsUsed.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {hud.summary.weaponsUsed.map((w) => (
                    <span
                      key={w}
                      className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-200"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs">
                {isSignedIn ? (
                  saveState === "saving" ? (
                    <span className="text-zinc-300">Salvando pontuação no ranking global...</span>
                  ) : saveState === "saved" ? (
                    <span className="text-emerald-300">{saveMessage}</span>
                  ) : saveState === "error" ? (
                    <span className="text-amber-300">{saveMessage}</span>
                  ) : null
                ) : (
                  <span className="text-zinc-300">
                    Recorde salvo localmente.{" "}
                    <Link href="/sign-in" className="font-semibold text-white underline">
                      Entre na conta
                    </Link>{" "}
                    para aparecer no Ranking Global!
                  </span>
                )}
              </div>

              <div className="flex gap-2.5">
                <Button size="lg" onClick={() => handleStart()} className="flex-1 font-semibold">
                  <RotateCcw className="mr-2 size-4" aria-hidden />
                  Jogar de Novo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => engineRef.current?.returnToTitle()}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Mapas
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Roteiro das 5 Cidades / Fases */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" aria-hidden />
          <h2 className="font-display text-xl font-semibold">Rota das 5 Fases</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {MAP_LIST.map((map) => (
            <button
              key={map.id}
              type="button"
              onClick={() => {
                handleSelectMap(map.id);
                if (hud?.phase !== "playing") {
                  stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className={cn(
                "flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/60",
                (hud?.mapId ?? selectedMap) === map.id && "border-primary"
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={map.isFinalStage ? "destructive" : "secondary"} className="text-[10px]">
                    {map.isFinalStage ? "Boss Final" : `Fase ${map.order}`}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{map.stateLabel}</span>
                </div>
                <h3 className="font-display text-base font-semibold">{map.name}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {map.landmarks.slice(0, 3).join(" • ")}
                </p>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Chefe: <strong className="text-foreground">{map.bossDisplayName}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Guia rápido das Armas & Inimigos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <Swords className="size-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold">Arsenal do Ovelhera</h2>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {WEAPON_LIST.map((w) => (
              <li key={w.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: w.color }}
                  />
                  <span className="text-sm font-semibold">{w.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{w.tagline}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-semibold">Inimigos & Boss Final</h2>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {Object.values(ENEMY_ARCHETYPES).map((enemy) => (
              <li
                key={enemy.id}
                className={cn(
                  "rounded-lg border bg-muted/30 p-3",
                  enemy.isBoss && "border-destructive/40 bg-destructive/5 sm:col-span-2"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    {enemy.isBoss && <Flame className="size-3.5 text-destructive" aria-hidden />}
                    {enemy.name}
                  </span>
                  <Badge variant={enemy.isBoss ? "destructive" : "secondary"} className="text-[10px]">
                    {enemy.isBoss ? "BOSS FINAL • SÃO LUÍS" : enemy.role}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {enemy.id === "evostt" && "Rápido e agressivo, aparece em horda logo no começo."}
                  {enemy.id === "lucas_podolski" && "Resistente e constante na perseguição."}
                  {enemy.id === "evangelion" && "Tanque pesado que rende bastante XP."}
                  {enemy.id === "zkug" && "Mantém distância média e dispara projéteis."}
                  {enemy.id === "morango" &&
                    "Boss final em São Luís (MA): alterna investida telegrafada e chuva de sementes!"}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Dica: fique de olho nas latinhas de <strong>Red Bull</strong> no minimapa para recuperar vida e ganhar velocidade!
          </p>
        </section>
      </div>

      {/* Ranking Global */}
      <GameLeaderboard currentUserId={user?.id} />
    </div>
  );
}
