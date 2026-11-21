import "server-only";
import { cache } from "react";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminDashboardData,
  AdminUserAwardSeason,
  AdminUserDetail,
  AdminUserGameSummary,
  AdminUserRole,
  AdminUserRow,
  DailyPoint,
  MonthlyPoint,
  TopPlayer,
  UserAchievement,
} from "@/lib/types";

/*
 * Leituras do painel admin. Usa o client service_role porque agrega dados de
 * vários usuários; todo chamador DEVE ter passado por requireAdmin()/ensureAdmin().
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE = 1000;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function displayName(u: User): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (u.username?.trim()) return u.username.trim();
  const email = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress;
  return email?.split("@")[0] ?? "Usuário";
}

function roleOf(u: User): AdminUserRole {
  return u.privateMetadata?.is_admin === true ? "admin" : "user";
}

function toIso(ms: number | null | undefined): string | null {
  return ms ? new Date(ms).toISOString() : null;
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Últimos `n` meses (inclui o atual), do mais antigo para o mais recente. */
function lastMonths(n: number): string[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
    return monthKey(d);
  });
}

function lastDays(n: number): string[] {
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  );
  return Array.from({ length: n }, (_, i) =>
    new Date(today - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10)
  );
}

/** Tabela ainda não aplicada no banco remoto: trata como vazia. */
function isMissingTable(code?: string) {
  return code === "42P01" || code === "PGRST205";
}

/** Lê todas as linhas de uma consulta paginando de 1000 em 1000. */
async function selectAll<T>(
  table: string,
  columns: string,
  eq?: [column: string, value: string]
): Promise<T[]> {
  const supabase = getSupabaseAdmin();
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from(table).select(columns);
    if (eq) query = query.eq(eq[0], eq[1]);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) {
      if (!isMissingTable(error.code)) console.error(`[admin-data] ${table}:`, error);
      return rows;
    }
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

/* ------------------------------------------------------------------ */
/* Usuários (Clerk)                                                     */
/* ------------------------------------------------------------------ */

const getAllClerkUsers = cache(async (): Promise<User[]> => {
  const client = await clerkClient();
  const users: User[] = [];
  const limit = 500;
  for (let offset = 0; ; offset += limit) {
    const { data, totalCount } = await client.users.getUserList({
      limit,
      offset,
      orderBy: "-created_at",
    });
    users.push(...data);
    if (data.length < limit || users.length >= totalCount) return users;
  }
});

type ScoreRow = { user_id: string; score: number; player_name: string; player_avatar: string | null; created_at: string; game_slug: string };
type VoteRow = { user_id: string; season_id: string; category_id: string };

const getAllScores = cache(() =>
  selectAll<ScoreRow>("game_scores", "user_id, score, player_name, player_avatar, created_at, game_slug")
);
const getAllVotes = cache(() =>
  selectAll<VoteRow>("award_votes", "user_id, season_id, category_id")
);

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const [users, scores, votes] = await Promise.all([
    getAllClerkUsers(),
    getAllScores(),
    getAllVotes(),
  ]);

  const plays = new Map<string, { n: number; best: number }>();
  for (const s of scores) {
    const cur = plays.get(s.user_id) ?? { n: 0, best: 0 };
    cur.n += 1;
    cur.best = Math.max(cur.best, s.score);
    plays.set(s.user_id, cur);
  }
  const voteCount = new Map<string, number>();
  for (const v of votes) voteCount.set(v.user_id, (voteCount.get(v.user_id) ?? 0) + 1);

  return users.map((u) => {
    const p = plays.get(u.id);
    return {
      id: u.id,
      name: displayName(u),
      username: u.username ?? null,
      email:
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? null,
      imageUrl: u.imageUrl ?? null,
      role: roleOf(u),
      createdAt: toIso(u.createdAt),
      lastSignInAt: toIso(u.lastSignInAt),
      gamesPlayed: p?.n ?? 0,
      bestScore: p ? p.best : null,
      votes: voteCount.get(u.id) ?? 0,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

const CONTENT_TABLES = ["historias", "musicas", "esculachos", "clipes"] as const;

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdmin();
  const months = lastMonths(12);
  const days = lastDays(30);
  const now = Date.now();

  const [users, scores, votes, contentRows, inimigos, seasonsCount, activeSeason] =
    await Promise.all([
      getAllClerkUsers().catch((e) => {
        console.error("[admin-data] Clerk:", e);
        return [] as User[];
      }),
      getAllScores(),
      getAllVotes(),
      Promise.all(
        CONTENT_TABLES.map((t) => selectAll<{ created_at: string | null }>(t, "created_at"))
      ),
      selectAll<{ status: string }>("inimigos", "status"),
      supabase.from("award_seasons").select("id", { count: "exact", head: true }),
      supabase
        .from("award_seasons")
        .select("id, title, year")
        .eq("status", "active")
        .order("year", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Usuários
  const signups = new Map(months.map((m) => [m, 0]));
  let newLast30d = 0;
  let activeLast30d = 0;
  let admins = 0;
  for (const u of users) {
    if (roleOf(u) === "admin") admins++;
    if (u.createdAt) {
      const k = monthKey(new Date(u.createdAt));
      if (signups.has(k)) signups.set(k, signups.get(k)! + 1);
      if (now - u.createdAt <= 30 * DAY_MS) newLast30d++;
    }
    if (u.lastSignInAt && now - u.lastSignInAt <= 30 * DAY_MS) activeLast30d++;
  }

  // Conteúdo por mês
  const contentByMonth: MonthlyPoint[] = months.map((month) => {
    const point: MonthlyPoint = { month };
    CONTENT_TABLES.forEach((t) => (point[t] = 0));
    return point;
  });
  const monthIndex = new Map(months.map((m, i) => [m, i]));
  CONTENT_TABLES.forEach((table, ti) => {
    for (const row of contentRows[ti]) {
      if (!row.created_at) continue;
      const i = monthIndex.get(monthKey(new Date(row.created_at)));
      if (i !== undefined) (contentByMonth[i][table] as number)++;
    }
  });

  // Jogos
  const dayIndex = new Map(days.map((d, i) => [d, i]));
  const playsByDay: DailyPoint[] = days.map((day) => ({ day, value: 0 }));
  const best = new Map<string, TopPlayer>();
  for (const s of scores) {
    const i = dayIndex.get(s.created_at.slice(0, 10));
    if (i !== undefined) playsByDay[i].value++;
    const cur = best.get(s.user_id);
    if (!cur) {
      best.set(s.user_id, {
        userId: s.user_id,
        name: s.player_name,
        avatar: s.player_avatar,
        score: s.score,
        plays: 1,
      });
    } else {
      cur.plays++;
      if (s.score > cur.score) cur.score = s.score;
    }
  }
  const topPlayers = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 5);

  // Awards
  const voters = new Set(votes.map((v) => v.user_id));

  return {
    users: {
      total: users.length,
      admins,
      newLast30d,
      activeLast30d,
      signupsByMonth: months.map((month) => ({ month, value: signups.get(month) ?? 0 })),
    },
    content: {
      counts: {
        historias: contentRows[0].length,
        musicas: contentRows[1].length,
        esculachos: contentRows[2].length,
        clipes: contentRows[3].length,
        inimigos: inimigos.length,
        seasons: seasonsCount.count ?? 0,
      },
      byMonth: contentByMonth,
    },
    inimigos: {
      pendente: inimigos.filter((i) => i.status === "pendente").length,
      vingado: inimigos.filter((i) => i.status === "vingado").length,
    },
    games: {
      totalPlays: scores.length,
      uniquePlayers: best.size,
      playsLast30d: playsByDay.reduce((acc, d) => acc + d.value, 0),
      playsByDay,
      topPlayers,
    },
    awards: {
      activeSeason: activeSeason.data
        ? {
            id: activeSeason.data.id,
            title: activeSeason.data.title,
            year: activeSeason.data.year ?? null,
          }
        : null,
      totalVotes: votes.length,
      uniqueVoters: voters.size,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Detalhe de um usuário                                                */
/* ------------------------------------------------------------------ */

type RunRow = {
  id: string;
  game_slug: string;
  score: number;
  kills: number;
  level_reached: number;
  survival_seconds: number;
  bosses_defeated: number;
  weapons_used: unknown;
  created_at: string;
};

/** Retorna null se o usuário não existir no Clerk. */
export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const client = await clerkClient();
  let user: User;
  try {
    user = await client.users.getUser(userId);
  } catch {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const [runs, allScores, userVotes, achievements, seasons, categories] = await Promise.all([
    selectAll<RunRow>(
      "game_scores",
      "id, game_slug, score, kills, level_reached, survival_seconds, bosses_defeated, weapons_used, created_at",
      ["user_id", userId]
    ),
    getAllScores(),
    selectAll<VoteRow>("award_votes", "user_id, season_id, category_id", ["user_id", userId]),
    supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    selectAll<{ id: string; title: string; year: number | null }>(
      "award_seasons",
      "id, title, year"
    ),
    selectAll<{ id: string; season_id: string }>("award_categories", "id, season_id"),
  ]);

  runs.sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Resumo por jogo + posição no ranking (melhor score de cada jogador)
  const bestByGame = new Map<string, Map<string, number>>();
  for (const s of allScores) {
    const m = bestByGame.get(s.game_slug) ?? new Map<string, number>();
    m.set(s.user_id, Math.max(m.get(s.user_id) ?? 0, s.score));
    bestByGame.set(s.game_slug, m);
  }

  const summaries = new Map<string, AdminUserGameSummary>();
  for (const r of runs) {
    const cur = summaries.get(r.game_slug) ?? {
      gameSlug: r.game_slug,
      plays: 0,
      bestScore: 0,
      totalKills: 0,
      totalSeconds: 0,
      bestLevel: 0,
      bossesDefeated: 0,
      rank: null,
      rankedPlayers: 0,
    };
    cur.plays++;
    cur.bestScore = Math.max(cur.bestScore, r.score);
    cur.totalKills += r.kills;
    cur.totalSeconds += r.survival_seconds;
    cur.bestLevel = Math.max(cur.bestLevel, r.level_reached);
    cur.bossesDefeated += r.bosses_defeated;
    summaries.set(r.game_slug, cur);
  }
  for (const s of summaries.values()) {
    const ranking = bestByGame.get(s.gameSlug);
    if (!ranking) continue;
    s.rankedPlayers = ranking.size;
    s.rank = [...ranking.values()].filter((v) => v > s.bestScore).length + 1;
  }

  // Armas mais usadas
  const weaponCount = new Map<string, number>();
  for (const r of runs) {
    const list = Array.isArray(r.weapons_used) ? r.weapons_used.map(String) : [];
    for (const w of new Set(list)) weaponCount.set(w, (weaponCount.get(w) ?? 0) + 1);
  }

  // Awards: quantas categorias votou por temporada (sem revelar os votos)
  const catsPerSeason = new Map<string, number>();
  for (const c of categories) catsPerSeason.set(c.season_id, (catsPerSeason.get(c.season_id) ?? 0) + 1);
  const votedPerSeason = new Map<string, number>();
  for (const v of userVotes) votedPerSeason.set(v.season_id, (votedPerSeason.get(v.season_id) ?? 0) + 1);
  const awards: AdminUserAwardSeason[] = seasons
    .filter((s) => votedPerSeason.has(s.id))
    .map((s) => ({
      seasonId: s.id,
      title: s.title,
      year: s.year ?? null,
      categoriesVoted: votedPerSeason.get(s.id) ?? 0,
      totalCategories: catsPerSeason.get(s.id) ?? 0,
    }))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return {
    id: user.id,
    name: displayName(user),
    username: user.username ?? null,
    imageUrl: user.imageUrl ?? null,
    role: roleOf(user),
    createdAt: toIso(user.createdAt),
    lastSignInAt: toIso(user.lastSignInAt),
    games: [...summaries.values()].sort((a, b) => b.plays - a.plays),
    recentRuns: runs.slice(0, 10).map((r) => ({
      id: r.id,
      gameSlug: r.game_slug,
      score: r.score,
      kills: r.kills,
      levelReached: r.level_reached,
      survivalSeconds: r.survival_seconds,
      bossesDefeated: r.bosses_defeated,
      weaponsUsed: Array.isArray(r.weapons_used) ? r.weapons_used.map(String) : [],
      createdAt: r.created_at,
    })),
    scoreHistory: [...runs]
      .reverse()
      .slice(-40)
      .map((r) => ({ date: r.created_at, score: r.score })),
    topWeapons: [...weaponCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([weapon, count]) => ({ weapon, count })),
    awards,
    achievements: (achievements.data ?? []) as UserAchievement[],
  };
}
