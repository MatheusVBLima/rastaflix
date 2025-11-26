import { createClient } from "@supabase/supabase-js";
import { Story, Music, Inimigo, Esculacho } from "./types";

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
    .select("id, titulo, descricao, conteudo, autor, created_at")
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
      .select("id, titulo, descricao, conteudo, autor, created_at")
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
