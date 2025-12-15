import { createClient } from "@supabase/supabase-js";
import {
  Story,
  Music,
  Inimigo,
  Esculacho,
  AwardSeason,
  AwardCategory,
  AwardNominee,
  AwardVote,
  VoteResults,
  CategoryWithResults,
  CategoryWithNominees,
  VotingData,
  Clipe,
  ClipePlatform,
  StreamerConfig,
} from "./types";

/**
 * Helper para criar cliente Supabase
 * Nota: Não usa "use server" - pode ser chamado tanto no servidor quanto no cliente
 */
function getSupabaseClientDirect() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ========================================
// HISTÓRIAS (Stories)
// ========================================

export async function fetchHistorias(): Promise<Story[]> {
  const supabase = getSupabaseClientDirect();

  const { data, error } = await supabase
    .from("historias")
    .select("id, title, description, tags, url, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórias do Supabase:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Mapear os dados para a interface Story
  return data.map((story) => ({
    ...story,
    description: story.description || "",
    tags: story.tags || [],
    imageUrl: story.image_url,
  }));
}

export async function fetchStoryById(
  storyId: string
): Promise<{ story: Story | null; error?: string }> {
  if (!storyId || storyId.trim() === "") {
    console.error("[queries] ID da história não fornecido ou vazio");
    return { story: null, error: "ID da história não fornecido." };
  }

  const cleanId = storyId.trim();

  try {
    const supabase = getSupabaseClientDirect();

    const { data, error } = await supabase
      .from("historias")
      .select("*")
      .eq("id", cleanId)
      .single();

    if (error) {
      console.error("[queries] Erro ao buscar história:", error);
      return { story: null, error: error.message };
    }

    if (!data) {
      console.error("[queries] Nenhum dado encontrado para o ID:", cleanId);
      return { story: null, error: "História não encontrada." };
    }

    const story: Story = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      tags: data.tags || [],
      url: data.url,
      imageUrl: data.image_url,
      created_at: data.created_at,
    };

    return { story };
  } catch (error: any) {
    console.error("[queries] Exceção ao buscar história:", error);
    return { story: null, error: `Erro ao buscar história: ${error.message}` };
  }
}

// ========================================
// MÚSICAS (Music)
// ========================================

export async function fetchMusicas(): Promise<Music[]> {
  const supabase = getSupabaseClientDirect();

  const { data, error } = await supabase
    .from("musicas")
    .select("id, title, url, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar músicas do Supabase:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((music) => ({
    ...music,
    imageUrl: music.image_url,
    id: music.id || "",
    title: music.title || "",
    url: music.url || "",
  }));
}

export async function fetchMusicById(
  id: string
): Promise<{ music?: Music; error?: string }> {
  if (!id) {
    return { error: "ID da música não fornecido" };
  }

  try {
    const supabase = getSupabaseClientDirect();
    const { data, error } = await supabase
      .from("musicas")
      .select("id, title, url, image_url, created_at")
      .eq("id", id)
      .single();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: "Música não encontrada" };
    }

    const music: Music = {
      id: data.id,
      title: data.title,
      url: data.url,
      imageUrl: data.image_url,
      created_at: data.created_at,
    };

    return { music };
  } catch (error) {
    console.error("Erro ao buscar música por ID:", error);
    return { error: "Erro ao buscar música" };
  }
}

// ========================================
// INIMIGOS (Enemies)
// ========================================

export async function fetchInimigos(): Promise<Inimigo[]> {
  const supabase = getSupabaseClientDirect();

  try {
    const { data, error } = await supabase
      .from("inimigos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro do Supabase ao buscar inimigos:", error);
      return [];
    }
    return data || [];
  } catch (e: any) {
    console.error("Exceção ao buscar inimigos:", e);
    return [];
  }
}

export async function fetchInimigoById(id: string): Promise<Inimigo | null> {
  if (!id) return null;

  const supabase = getSupabaseClientDirect();

  try {
    const { data, error } = await supabase
      .from("inimigos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (
        error.code !== "PGRST116" ||
        (error.code === "PGRST116" && !error.message.includes("multiple rows"))
      ) {
        console.error("Erro do Supabase ao buscar inimigo por ID:", error);
      }
      return null;
    }

    return data || null;
  } catch (e: any) {
    console.error("Exceção ao buscar inimigo por ID:", e);
    return null;
  }
}

// ========================================
// ESCULACHOS (Roasts)
// ========================================

export async function fetchEsculachos(): Promise<Esculacho[]> {
  const supabase = getSupabaseClientDirect();

  const { data, error } = await supabase
    .from("esculachos")
    .select("id, titulo, descricao, conteudo, autor, audio_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar esculachos do Supabase:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    ...item,
    id: item.id || "",
    titulo: item.titulo || "",
    conteudo: item.conteudo || "",
    descricao: item.descricao,
    autor: item.autor,
    audio_url: item.audio_url,
  }));
}

export async function fetchEsculachoById(
  id: string
): Promise<{ esculacho?: Esculacho; error?: string }> {
  if (!id) {
    return { error: "ID do esculacho não fornecido" };
  }

  try {
    const supabase = getSupabaseClientDirect();
    const { data, error } = await supabase
      .from("esculachos")
      .select("id, titulo, descricao, conteudo, autor, audio_url, created_at")
      .eq("id", id)
      .single();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: "Esculacho não encontrado" };
    }

    const esculacho: Esculacho = {
      id: data.id,
      titulo: data.titulo,
      descricao: data.descricao,
      conteudo: data.conteudo,
      autor: data.autor,
      audio_url: data.audio_url,
      created_at: data.created_at,
    };

    return { esculacho };
  } catch (error) {
    console.error("Erro ao buscar esculacho por ID:", error);
    return { error: "Erro ao buscar esculacho" };
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Função para obter todas as tags únicas das histórias
 */
export async function getAllTags(historias: Story[]): Promise<string[]> {
  const allTags = new Set<string>();
  historias.forEach((story) => {
    story.tags.forEach((tag) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}

// ========================================
// RASTA AWARDS QUERIES
// ========================================

/**
 * Buscar a temporada ativa (status = 'active')
 */
export async function fetchActiveSeason(): Promise<AwardSeason | null> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar temporada ativa:", error);
    return null;
  }

  return data;
}

/**
 * Buscar todas as temporadas (ordenadas por ano DESC)
 */
export async function fetchAllSeasons(): Promise<AwardSeason[]> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_seasons")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    console.error("Erro ao buscar temporadas:", error);
    return [];
  }

  return data || [];
}

/**
 * Buscar uma temporada específica por ID
 */
export async function fetchSeasonById(
  seasonId: string
): Promise<AwardSeason | null> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_seasons")
    .select("*")
    .eq("id", seasonId)
    .single();

  if (error) {
    console.error("Erro ao buscar temporada por ID:", error);
    return null;
  }

  return data;
}

/**
 * Buscar categorias de uma temporada (ordenadas por display_order)
 */
export async function fetchCategoriesBySeason(
  seasonId: string
): Promise<AwardCategory[]> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_categories")
    .select("*")
    .eq("season_id", seasonId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }

  return data || [];
}

/**
 * Buscar uma categoria específica por ID
 */
export async function fetchCategoryById(
  categoryId: string
): Promise<AwardCategory | null> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (error) {
    console.error("Erro ao buscar categoria por ID:", error);
    return null;
  }

  return data;
}

/**
 * Buscar nominados de uma categoria (ordenados por display_order)
 */
export async function fetchNomineesByCategory(
  categoryId: string
): Promise<AwardNominee[]> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_nominees")
    .select("*")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar nominados:", error);
    return [];
  }

  return data || [];
}

/**
 * Buscar um nominado específico por ID
 */
export async function fetchNomineeById(
  nomineeId: string
): Promise<AwardNominee | null> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_nominees")
    .select("*")
    .eq("id", nomineeId)
    .single();

  if (error) {
    console.error("Erro ao buscar nominado por ID:", error);
    return null;
  }

  return data;
}

/**
 * Buscar dados completos para a página de votação
 * Retorna temporada com categorias e nominados
 */
export async function fetchVotingData(
  seasonId: string
): Promise<VotingData | null> {
  const supabase = getSupabaseClientDirect();

  // 1. Buscar temporada
  const season = await fetchSeasonById(seasonId);
  if (!season) return null;

  // 2. Buscar categorias da temporada
  const categories = await fetchCategoriesBySeason(seasonId);

  // 3. Para cada categoria, buscar nominados
  const categoriesWithNominees: CategoryWithNominees[] = await Promise.all(
    categories.map(async (category) => {
      const nominees = await fetchNomineesByCategory(category.id);
      return {
        ...category,
        nominees,
      };
    })
  );

  return {
    season,
    categories: categoriesWithNominees,
  };
}

/**
 * Buscar votos de um usuário em uma temporada
 */
export async function fetchUserVotes(
  userId: string,
  seasonId: string
): Promise<AwardVote[]> {
  const supabase = getSupabaseClientDirect();
  const { data, error } = await supabase
    .from("award_votes")
    .select("*")
    .eq("user_id", userId)
    .eq("season_id", seasonId);

  if (error) {
    console.error("Erro ao buscar votos do usuário:", error);
    return [];
  }

  return data || [];
}

/**
 * Buscar resultados de votação de uma categoria (ADMIN ONLY)
 * Retorna contagem de votos por nominado
 */
export async function fetchVoteResults(
  categoryId: string
): Promise<VoteResults[]> {
  const supabase = getSupabaseClientDirect();

  // Buscar todos os nominados da categoria
  const nominees = await fetchNomineesByCategory(categoryId);

  // Buscar contagem de votos para cada nominado
  const { data: votes, error } = await supabase
    .from("award_votes")
    .select("nominee_id")
    .eq("category_id", categoryId);

  if (error) {
    console.error("Erro ao buscar resultados:", error);
    return [];
  }

  // Contar votos por nominado
  const voteCounts = new Map<string, number>();
  votes?.forEach((vote) => {
    const count = voteCounts.get(vote.nominee_id) || 0;
    voteCounts.set(vote.nominee_id, count + 1);
  });

  const totalVotes = votes?.length || 0;

  // Montar resultado com porcentagem
  return nominees.map((nominee) => {
    const voteCount = voteCounts.get(nominee.id) || 0;
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

    return {
      nominee_id: nominee.id,
      nominee_title: nominee.title,
      vote_count: voteCount,
      percentage: Math.round(percentage * 100) / 100, // 2 casas decimais
    };
  });
}

/**
 * Buscar todas as categorias com resultados (ADMIN ONLY)
 * Retorna categorias com nominados e contagem de votos
 */
export async function fetchAllCategoriesWithResults(
  seasonId: string
): Promise<CategoryWithResults[]> {
  const categories = await fetchCategoriesBySeason(seasonId);

  const categoriesWithResults: CategoryWithResults[] = await Promise.all(
    categories.map(async (category) => {
      const nominees = await fetchNomineesByCategory(category.id);

      // Buscar votos da categoria
      const supabase = getSupabaseClientDirect();
      const { data: votes, error } = await supabase
        .from("award_votes")
        .select("nominee_id")
        .eq("category_id", category.id);

      if (error) {
        console.error("Erro ao buscar votos da categoria:", error);
        return {
          ...category,
          nominees,
          total_votes: 0,
        };
      }

      // Contar votos por nominado
      const voteCounts = new Map<string, number>();
      votes?.forEach((vote) => {
        const count = voteCounts.get(vote.nominee_id) || 0;
        voteCounts.set(vote.nominee_id, count + 1);
      });

      const totalVotes = votes?.length || 0;

      // Adicionar contagem e porcentagem aos nominados
      const nomineesWithVotes = nominees.map((nominee) => {
        const voteCount = voteCounts.get(nominee.id) || 0;
        const percentage =
          totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return {
          ...nominee,
          vote_count: voteCount,
          percentage: Math.round(percentage * 100) / 100,
        };
      });

      return {
        ...category,
        nominees: nomineesWithVotes,
        total_votes: totalVotes,
      };
    })
  );

  return categoriesWithResults;
}

// ========================================
// CLIPES
// ========================================

/**
 * Buscar todos os clipes (ordenados por data de criação DESC)
 */
export async function fetchClipes(): Promise<Clipe[]> {
  const supabase = getSupabaseClientDirect();

  const { data, error } = await supabase
    .from("clipes")
    .select("id, titulo, url, thumbnail_url, plataforma, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar clipes do Supabase:", error);
    return [];
  }

  return data || [];
}

/**
 * Buscar clipes por plataforma
 */
export async function fetchClipesByPlatform(
  platform: ClipePlatform
): Promise<Clipe[]> {
  const supabase = getSupabaseClientDirect();

  const { data, error } = await supabase
    .from("clipes")
    .select("id, titulo, url, thumbnail_url, plataforma, created_at")
    .eq("plataforma", platform)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Erro ao buscar clipes da plataforma ${platform}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Buscar clipe por ID
 */
export async function fetchClipeById(
  id: string
): Promise<{ clipe?: Clipe; error?: string }> {
  if (!id) {
    return { error: "ID do clipe não fornecido" };
  }

  try {
    const supabase = getSupabaseClientDirect();
    const { data, error } = await supabase
      .from("clipes")
      .select("id, titulo, url, thumbnail_url, plataforma, created_at")
      .eq("id", id)
      .single();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: "Clipe não encontrado" };
    }

    return { clipe: data };
  } catch (error) {
    console.error("Erro ao buscar clipe por ID:", error);
    return { error: "Erro ao buscar clipe" };
  }
}

// ========================================
// STREAMER CONFIG (Live Status)
// ========================================

/**
 * Buscar configuração/status do streamer
 */
export async function fetchStreamerStatus(): Promise<StreamerConfig | null> {
  const supabase = getSupabaseClientDirect();

  const { data, error } = await supabase
    .from("streamer_config")
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao buscar status do streamer:", error);
    return null;
  }

  return data;
}
