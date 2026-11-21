"use client";

import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CalendarDays, Clock, Gamepad2, Medal, Skull, Swords, Trophy, Vote } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { RoleBadge } from "@/components/admin/users/UsersTable";
import { formatDuration, initials } from "@/components/admin/dashboard/format";
import { WEAPON_DEFINITIONS } from "@/lib/games/ilha-do-avo/content";
import { formatDate, formatRelative } from "@/lib/format";
import type { AdminUserDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const GAME_NAMES: Record<string, string> = {
  "ilha-do-avo-romeno": "Ovelhera Survivors",
};

function weaponName(id: string) {
  return (WEAPON_DEFINITIONS as Record<string, { name: string }>)[id]?.name ?? id;
}

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const scoreConfig = { score: { label: "Pontuação", color: "var(--chart-1)" } } satisfies ChartConfig;
const weaponConfig = { count: { label: "Partidas", color: "var(--chart-3)" } } satisfies ChartConfig;

function Tile({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5", className)}>
      <header className="space-y-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg bg-muted/40 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function UserDetail({ user }: { user: AdminUserDetail }) {
  const totals = user.games.reduce(
    (acc, g) => ({
      plays: acc.plays + g.plays,
      kills: acc.kills + g.totalKills,
      seconds: acc.seconds + g.totalSeconds,
      best: Math.max(acc.best, g.bestScore),
    }),
    { plays: 0, kills: 0, seconds: 0, best: 0 }
  );
  const history = user.scoreHistory.map((p, i) => ({
    ...p,
    label: `#${i + 1}`,
    when: dateTimeFmt.format(new Date(p.date)),
  }));
  const weapons = user.topWeapons.map((w) => ({ ...w, name: weaponName(w.weapon) }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Identidade */}
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 lg:col-span-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user.imageUrl && <AvatarImage src={user.imageUrl} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-display text-xl font-semibold">{user.name}</p>
            {user.username && (
              <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            )}
            <RoleBadge role={user.role} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-0.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              Membro desde
            </dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              Último acesso
            </dt>
            <dd>{formatRelative(user.lastSignInAt) ?? "Nunca"}</dd>
          </div>
        </dl>
      </section>

      {/* Números gerais */}
      <section className="rounded-xl border bg-card p-5 lg:col-span-8">
        <dl className="grid h-full grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={Gamepad2} label="Partidas" value={totals.plays.toLocaleString("pt-BR")} />
          <Stat icon={Trophy} label="Recorde" value={totals.best ? totals.best.toLocaleString("pt-BR") : "—"} />
          <Stat icon={Skull} label="Abates" value={totals.kills.toLocaleString("pt-BR")} />
          <Stat icon={Clock} label="Tempo jogado" value={totals.seconds ? formatDuration(totals.seconds) : "—"} />
        </dl>
      </section>

      {/* Evolução */}
      <Tile
        className="lg:col-span-8"
        title="Evolução da pontuação"
        description={
          history.length ? `Últimas ${history.length} partidas, da mais antiga à mais recente` : undefined
        }
      >
        {history.length === 0 ? (
          <Empty>Este usuário ainda não jogou.</Empty>
        ) : (
          <ChartContainer config={scoreConfig} className="aspect-auto h-60 w-full">
            <AreaChart data={history} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fill-score" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-score)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-score)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} width={56} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.when ?? ""}
                  />
                }
              />
              <Area dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2} fill="url(#fill-score)" />
            </AreaChart>
          </ChartContainer>
        )}
      </Tile>

      {/* Ranking por jogo */}
      <Tile className="lg:col-span-4" title="Ranking" description="Posição pelo melhor score">
        {user.games.length === 0 ? (
          <Empty>Sem partidas registradas.</Empty>
        ) : (
          <ul className="space-y-3">
            {user.games.map((g) => (
              <li key={g.gameSlug} className="space-y-2 rounded-lg bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{GAME_NAMES[g.gameSlug] ?? g.gameSlug}</span>
                  {g.rank && (
                    <span className="flex items-center gap-1 font-mono text-sm font-semibold tabular-nums">
                      <Medal className="size-3.5 text-primary" aria-hidden />
                      {g.rank}º
                      <span className="text-xs font-normal text-muted-foreground">de {g.rankedPlayers}</span>
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Partidas</dt>
                    <dd className="font-mono tabular-nums">{g.plays}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nível máx.</dt>
                    <dd className="font-mono tabular-nums">{g.bestLevel}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Chefes</dt>
                    <dd className="font-mono tabular-nums">{g.bossesDefeated}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Tile>

      {/* Armas */}
      <Tile className="lg:col-span-5" title="Armas favoritas" description="Em quantas partidas cada arma foi usada">
        {weapons.length === 0 ? (
          <Empty>Nenhuma arma registrada.</Empty>
        ) : (
          <ChartContainer config={weaponConfig} className="aspect-auto h-56 w-full">
            <BarChart data={weapons} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={96} />
              <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </Tile>

      {/* Partidas recentes */}
      <Tile className="lg:col-span-7" title="Partidas recentes">
        {user.recentRuns.length === 0 ? (
          <Empty>Sem partidas registradas.</Empty>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-medium">Quando</th>
                  <th className="px-2 py-1.5 text-right font-medium">Pontos</th>
                  <th className="px-2 py-1.5 text-right font-medium">Abates</th>
                  <th className="px-2 py-1.5 text-right font-medium">Nível</th>
                  <th className="px-2 py-1.5 text-right font-medium">Duração</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {user.recentRuns.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="whitespace-nowrap px-2 py-2 font-sans text-muted-foreground">
                      {dateTimeFmt.format(new Date(r.createdAt))}
                    </td>
                    <td className="px-2 py-2 text-right font-semibold">{r.score.toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-2 text-right">{r.kills.toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-2 text-right">{r.levelReached}</td>
                    <td className="px-2 py-2 text-right">{formatDuration(r.survivalSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tile>

      {/* Awards */}
      <Tile
        className="lg:col-span-12"
        title="Rasta Awards"
        description="Participação por temporada (os votos em si continuam secretos)"
      >
        {user.awards.length === 0 && user.achievements.length === 0 ? (
          <Empty>Este usuário ainda não votou.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {user.awards.map((a) => {
              const pct = a.totalCategories ? Math.round((a.categoriesVoted / a.totalCategories) * 100) : 0;
              return (
                <li key={a.seasonId} className="space-y-2 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <Vote className="size-3.5 text-primary" aria-hidden />
                      {a.title}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {a.categoriesVoted}/{a.totalCategories}
                    </span>
                  </div>
                  <Progress value={pct} aria-label={`${pct}% das categorias votadas`} />
                </li>
              );
            })}
            {user.achievements.map((ach) => (
              <li key={ach.id} className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
                <Swords className="size-4 text-primary" aria-hidden />
                {ach.achievement_type === "rasta_awards_voter"
                  ? `Conquista: eleitor do Rasta Awards ${ach.achievement_year}`
                  : `Conquista ${ach.achievement_year}`}
              </li>
            ))}
          </ul>
        )}
      </Tile>
    </div>
  );
}
