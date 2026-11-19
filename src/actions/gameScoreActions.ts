"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  SubmitGameScoreSchema,
  type GameScoreActionResponse,
  type GameScoreEntry,
  type SubmitGameScoreInput,
} from "@/lib/types";

function resolveDisplayName(user: {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
}): string {
  if (user.username?.trim()) return user.username.trim();
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (email) return email.split("@")[0] ?? "Jogador";
  return "Jogador";
}

/**
 * Registra a pontuação de uma run concluída no Supabase.
 * Requer autenticação via Clerk; a escrita usa service_role.
 */
export async function submitGameScore(
  input: SubmitGameScoreInput
): Promise<GameScoreActionResponse> {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      message: "Entre com sua conta para registrar sua pontuação no ranking global.",
    };
  }

  const parsed = SubmitGameScoreSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados da partida inválidos.",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const data = parsed.data;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const playerName = resolveDisplayName(user).slice(0, 48);
    const playerAvatar = user.imageUrl ?? null;

    const supabase = getSupabaseAdmin();

    // Checa recorde pessoal anterior antes de inserir
    const { data: prevBest } = await supabase
      .from("game_scores")
      .select("score")
      .eq("game_slug", data.gameSlug)
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isNewPersonalBest = !prevBest || data.score > prevBest.score;

    const { data: inserted, error } = await supabase
      .from("game_scores")
      .insert({
        game_slug: data.gameSlug,
        user_id: userId,
        player_name: playerName,
        player_avatar: playerAvatar,
        score: data.score,
        kills: data.kills,
        level_reached: data.levelReached,
        survival_seconds: data.survivalSeconds,
        bosses_defeated: data.bossesDefeated,
        weapons_used: data.weaponsUsed,
        seed: data.seed ?? null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return {
          success: false,
          message:
            "A tabela de ranking ainda não foi criada no Supabase (rode a migration game_scores).",
        };
      }
      console.error("[gameScoreActions] Erro ao inserir score:", error);
      return {
        success: false,
        message: "Não foi possível salvar a pontuação no ranking.",
      };
    }

    revalidatePath(`/jogos/${data.gameSlug}`);
    revalidatePath("/jogos");

    const entry: GameScoreEntry = {
      ...inserted,
      weapons_used: Array.isArray(inserted.weapons_used)
        ? inserted.weapons_used.map(String)
        : [],
    };

    return {
      success: true,
      message: isNewPersonalBest
        ? "Novo recorde pessoal registrado no ranking!"
        : "Pontuação registrada no ranking!",
      entry,
      isNewPersonalBest,
    };
  } catch (err) {
    console.error("[gameScoreActions] Exceção ao salvar score:", err);
    return {
      success: false,
      message: "Erro inesperado ao registrar pontuação.",
    };
  }
}
