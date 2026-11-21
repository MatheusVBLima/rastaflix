"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Crown, Gamepad2, Swords, Trophy, UserPlus, Users, Vote } from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminModules } from "@/components/admin/AdminModules";
import type { AdminDashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDayLabel, formatMonthLabel, initials } from "./format";

/* ------------------------------------------------------------------ */
/* Blocos base                                                          */
/* ------------------------------------------------------------------ */

function Tile({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
  spark,
  className,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  hint?: ReactNode;
  spark?: { key: string; data: { value: number }[]; color: string };
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex min-w-0 flex-col justify-between gap-3 overflow-hidden rounded-xl border bg-card p-5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <div className="relative z-10 space-y-1">
        <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">
          <NumberFlow value={value} locales="pt-BR" />
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {spark && spark.data.some((d) => d.value > 0) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 opacity-60" aria-hidden>
          <ChartContainer
            config={{ value: { label, color: spark.color } }}
            className="aspect-auto h-full w-full"
          >
            <AreaChart data={spark.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${spark.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={1.5}
                fill={`url(#spark-${spark.key})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Configs dos gráficos                                                 */
/* ------------------------------------------------------------------ */

const signupsConfig = {
  value: { label: "Novos usuários", color: "var(--chart-1)" },
} satisfies ChartConfig;

const contentConfig = {
  historias: { label: "Histórias", color: "var(--chart-1)" },
  musicas: { label: "Músicas", color: "var(--chart-2)" },
  esculachos: { label: "Esculachos", color: "var(--chart-3)" },
  clipes: { label: "Clipes", color: "var(--chart-4)" },
} satisfies ChartConfig;

const playsConfig = {
  value: { label: "Partidas", color: "var(--chart-2)" },
} satisfies ChartConfig;

const inimigosConfig = {
  pendente: { label: "Pendentes", color: "var(--chart-1)" },
  vingado: { label: "Vingados", color: "var(--chart-2)" },
} satisfies ChartConfig;

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { users, content, games, awards, inimigos } = data;
  const signups = users.signupsByMonth.map((p) => ({ ...p, label: formatMonthLabel(p.month) }));
  const contentByMonth = content.byMonth.map((p) => ({ ...p, label: formatMonthLabel(p.month) }));
  const plays = games.playsByDay.map((p) => ({ ...p, label: formatDayLabel(p.day) }));
  const inimigosTotal = inimigos.pendente + inimigos.vingado;
  const inimigosData = [
    { key: "pendente", value: inimigos.pendente },
    { key: "vingado", value: inimigos.vingado },
  ];
  const contentTotal12m = content.byMonth.reduce(
    (acc, p) =>
      acc + Object.keys(contentConfig).reduce((s, k) => s + (Number(p[k]) || 0), 0),
    0
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
      {/* KPIs */}
      <Kpi
        className="lg:col-span-3"
        label="Usuários"
        value={users.total}
        icon={Users}
        hint={
          <>
            <span className="font-medium text-foreground">+{users.newLast30d}</span> nos últimos 30 dias
          </>
        }
        spark={{ key: "users", data: users.signupsByMonth.map((p) => ({ value: Number(p.value) })), color: "var(--chart-1)" }}
      />
      <Kpi
        className="lg:col-span-3"
        label="Ativos (30 dias)"
        value={users.activeLast30d}
        icon={UserPlus}
        hint={
          users.total > 0
            ? `${Math.round((users.activeLast30d / users.total) * 100)}% da base · ${users.admins} ${users.admins === 1 ? "admin" : "admins"}`
            : "Nenhum usuário ainda"
        }
      />
      <Kpi
        className="lg:col-span-3"
        label="Partidas jogadas"
        value={games.totalPlays}
        icon={Gamepad2}
        hint={`${games.playsLast30d} nos últimos 30 dias · ${games.uniquePlayers} ${games.uniquePlayers === 1 ? "jogador" : "jogadores"}`}
        spark={{ key: "plays", data: games.playsByDay, color: "var(--chart-2)" }}
      />
      <Kpi
        className="lg:col-span-3"
        label="Votos no Rasta Awards"
        value={awards.totalVotes}
        icon={Vote}
        hint={
          awards.activeSeason
            ? `${awards.uniqueVoters} eleitores · ${awards.activeSeason.title} em votação`
            : `${awards.uniqueVoters} ${awards.uniqueVoters === 1 ? "eleitor" : "eleitores"} · sem temporada ativa`
        }
      />

      {/* Novos usuários */}
      <Tile
        className="sm:col-span-2 lg:col-span-8"
        title="Novos usuários"
        description="Cadastros por mês nos últimos 12 meses"
      >
        <ChartContainer config={signupsConfig} className="aspect-auto h-60 w-full">
          <AreaChart data={signups} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fill-signups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              fill="url(#fill-signups)"
            />
          </AreaChart>
        </ChartContainer>
      </Tile>

      {/* Inimigos */}
      <Tile
        className="lg:col-span-4"
        title="Lista de inimigos"
        description="Situação da vingança"
      >
        {inimigosTotal === 0 ? (
          <EmptyTile>Nenhum inimigo cadastrado.</EmptyTile>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <ChartContainer config={inimigosConfig} className="aspect-square h-44">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
                <Pie
                  data={inimigosData}
                  dataKey="value"
                  nameKey="key"
                  innerRadius={52}
                  outerRadius={76}
                  strokeWidth={3}
                  stroke="var(--card)"
                >
                  {inimigosData.map((d) => (
                    <Cell key={d.key} fill={`var(--color-${d.key})`} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox)) return null;
                      const pct = Math.round((inimigos.vingado / inimigosTotal) * 100);
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-display text-2xl font-semibold">
                            {pct}%
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                            vingados
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <dl className="grid w-full grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted/50 p-2">
                <dt className="text-muted-foreground">Pendentes</dt>
                <dd className="font-mono text-base font-semibold tabular-nums">{inimigos.pendente}</dd>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <dt className="text-muted-foreground">Vingados</dt>
                <dd className="font-mono text-base font-semibold tabular-nums">{inimigos.vingado}</dd>
              </div>
            </dl>
          </div>
        )}
      </Tile>

      {/* Atalhos */}
      <Tile
        className="sm:col-span-2 lg:col-span-8"
        title="Gerenciar"
        description="Acesse cada área do painel"
      >
        <AdminModules counts={{ usuarios: users.total, ...content.counts }} />
      </Tile>

      {/* Top jogadores */}
      <Tile
        className="sm:col-span-2 lg:col-span-4"
        title="Top jogadores"
        description="Melhor pontuação de cada jogador"
        action={<Trophy className="size-4 text-primary" aria-hidden />}
      >
        {games.topPlayers.length === 0 ? (
          <EmptyTile>Ninguém jogou ainda.</EmptyTile>
        ) : (
          <ol className="space-y-1">
            {games.topPlayers.map((p, i) => (
              <li key={p.userId}>
                <Link
                  href={`/admin/usuarios/${p.userId}`}
                  transitionTypes={["nav-forward"]}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="w-4 text-center font-mono text-xs tabular-nums text-muted-foreground">
                    {i === 0 ? <Crown className="size-3.5 text-primary" aria-label="1º" /> : i + 1}
                  </span>
                  <Avatar className="size-7">
                    {p.avatar && <AvatarImage src={p.avatar} alt="" />}
                    <AvatarFallback className="text-[0.65rem]">{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.plays} {p.plays === 1 ? "partida" : "partidas"}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {p.score.toLocaleString("pt-BR")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Tile>

      {/* Conteúdo por mês */}
      <Tile
        className="sm:col-span-2 lg:col-span-7"
        title="Conteúdo publicado"
        description={`${contentTotal12m} ${contentTotal12m === 1 ? "item" : "itens"} nos últimos 12 meses`}
      >
        <ChartContainer config={contentConfig} className="aspect-auto h-64 w-full">
          <BarChart data={contentByMonth} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
            <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {Object.keys(contentConfig).map((key, i, arr) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="content"
                fill={`var(--color-${key})`}
                radius={i === arr.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </Tile>

      {/* Partidas por dia */}
      <Tile
        className="sm:col-span-2 lg:col-span-5"
        title="Atividade nos jogos"
        description="Partidas por dia nos últimos 30 dias"
        action={<Swords className="size-4 text-muted-foreground" aria-hidden />}
      >
        <ChartContainer config={playsConfig} className="aspect-auto h-64 w-full">
          <BarChart data={plays} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
            <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Tile>
    </div>
  );
}

function EmptyTile({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
