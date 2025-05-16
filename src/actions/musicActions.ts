"use server";

import {
  MusicSchema,
  EditMusicSchema,
  ActionResponse,
  Music,
} from "@/lib/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseClient, verificarAdmin } from "./commonActions";

export async function getMusicas(): Promise<Music[]> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("musicas")
    .select("id, title, url, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar músicas do Supabase:", error);
    return []; // Retorna array vazio em caso de erro
  }

  if (!data) {
    return [];
  }

  // Mapear os dados para a interface Music
  return data.map((music) => ({
    ...music,
    imageUrl: music.image_url, // Mapeamento direto
    id: music.id || "",
    title: music.title || "",
    url: music.url || "",
  }));
}

export async function getMusicById(
  id: string
): Promise<{ music?: Music; error?: string }> {
  if (!id) {
    return { error: "ID da música não fornecido" };
  }

  try {
    const supabase = await getSupabaseClient();
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

export async function addMusic(formData: FormData): Promise<ActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para adicionar músicas.",
    };
  }

  const rawData = {
    title: formData.get("title") as string,
    url: formData.get("url") as string,
    imageUrl: formData.get("imageUrl") as string | null,
  };

  try {
    // A validação e inserção usarão imageUrl como vier do formulário
    const validatedData = MusicSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("musicas")
      .insert([
        {
          title: validatedData.title,
          url: validatedData.url,
          image_url: validatedData.imageUrl, // Usar a imagem do formulário
        },
      ])
      .select();

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao salvar música: ${error.message}`,
      };
    }

    revalidatePath("/musicas");
    revalidatePath("/admin/musicas");

    return {
      success: true,
      message: `Música "${validatedData.title}" adicionada com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados da música.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao adicionar música:", error);
    return {
      success: false,
      message: "Erro ao adicionar música. Tente novamente mais tarde.",
    };
  }
}

export async function editMusic(formData: FormData): Promise<ActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para editar músicas.",
    };
  }

  const rawData = {
    id: formData.get("id") as string,
    title: formData.get("title") as string,
    url: formData.get("url") as string,
    imageUrl: formData.get("imageUrl") as string | null,
  };

  try {
    const validatedData = EditMusicSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("musicas")
      .update({
        title: validatedData.title,
        url: validatedData.url,
        image_url: validatedData.imageUrl, // Usar a imagem do formulário
      })
      .eq("id", validatedData.id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao atualizar música: ${error.message}`,
      };
    }

    revalidatePath("/musicas");
    revalidatePath("/admin/musicas");

    return {
      success: true,
      message: `Música "${validatedData.title}" atualizada com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados da música.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao editar música:", error);
    return {
      success: false,
      message: "Erro ao editar música. Tente novamente mais tarde.",
    };
  }
}

export async function deleteMusic(id: string): Promise<ActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para excluir músicas.",
    };
  }

  if (!id) {
    return {
      success: false,
      message: "ID da música não fornecido",
    };
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("musicas").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        message: `Erro ao excluir música: ${error.message}`,
      };
    }

    // Limpar cache
    revalidatePath("/musicas");
    revalidatePath("/admin/musicas");

    return {
      success: true,
      message: "Música excluída com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir música:", error);
    return {
      success: false,
      message: "Erro ao excluir música. Tente novamente mais tarde.",
    };
  }
}
