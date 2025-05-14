"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  StorySchema,
  ActionResponse,
  Story,
  EditStorySchema,
} from "@/lib/types";
import { getSupabaseClient, ensureAdmin } from "./commonActions";

// --- GET STORIES ---
export async function getHistorias(): Promise<Story[]> {
  console.log("Buscando histórias do Supabase...");
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("historias")
    .select("id, title, description, tags, url, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórias do Supabase:", error);
    return []; // Retorna array vazio em caso de erro
  }

  if (!data) {
    return [];
  }

  // Mapear os dados para a interface Story
  return data.map((story) => ({
    ...story,
    description: story.description || "", // Garantir que description seja string
    tags: story.tags || [], // Garantir que tags seja array
    imageUrl: story.image_url, // Mapeamento direto
  }));
}

// Função para obter todas as tags únicas das histórias
export async function getAllTags(historias: Story[]): Promise<string[]> {
  const allTags = new Set<string>();
  historias.forEach((story) => {
    story.tags.forEach((tag) => allTags.add(tag));
  });
  return Array.from(allTags).sort();
}

// --- ADD STORY ---
export async function addStory(
  prevState: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  let adminUserId;
  try {
    adminUserId = await ensureAdmin();
  } catch (error: any) {
    return { success: false, message: error.message };
  }

  const rawFormData = {
    title: formData.get("title"),
    description: formData.get("description"),
    tags: formData.get("tags")
      ? (formData.get("tags") as string)
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [],
    url: formData.get("url"),
    imageUrl: formData.get("imageUrl"),
  };

  const validatedFields = StorySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Erro de validação. Verifique os campos.",
      errors: Object.entries(validatedFields.error.flatten().fieldErrors).map(
        ([field, messages]: [string, string[] | undefined]) => ({
          field,
          message: (messages || [])[0] || "Erro desconhecido",
        })
      ),
    };
  }

  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("historias")
    .insert([
      {
        title: validatedFields.data.title,
        description: validatedFields.data.description,
        tags: validatedFields.data.tags,
        url: validatedFields.data.url,
        image_url: validatedFields.data.imageUrl || null,
        user_id: adminUserId,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Supabase error inserting story:", error);
    return {
      success: false,
      message: `Erro ao adicionar história: ${error.message}`,
    };
  }

  revalidatePath("/historias");
  revalidatePath("/admin/historias");

  return {
    success: true,
    message: "História adicionada com sucesso!",
    storyId: data?.id,
  };
}

// --- EDIT STORY ---
export async function editStory(
  prevState: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  let adminUserId;
  try {
    adminUserId = await ensureAdmin();
  } catch (error: any) {
    return { success: false, message: error.message };
  }

  const rawFormData = {
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    tags: formData.get("tags")
      ? (formData.get("tags") as string)
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [],
    url: formData.get("url"),
    imageUrl: formData.get("imageUrl"),
  };

  const validatedFields = EditStorySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Erro de validação.",
      errors: Object.entries(validatedFields.error.flatten().fieldErrors).map(
        ([field, messages]: [string, string[] | undefined]) => ({
          field,
          message: (messages || [])[0] || "Erro desconhecido",
        })
      ),
    };
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("historias")
    .update({
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      tags: validatedFields.data.tags,
      url: validatedFields.data.url,
      image_url: validatedFields.data.imageUrl || null,
    })
    .eq("id", validatedFields.data.id);

  if (error) {
    return {
      success: false,
      message: `Erro ao editar história: ${error.message}`,
    };
  }

  revalidatePath("/historias");
  revalidatePath(`/historias/${validatedFields.data.id}`);
  revalidatePath("/admin/historias");

  return { success: true, message: "História atualizada com sucesso!" };
}

// --- DELETE STORY ---
export async function deleteStory(storyId: string): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error: any) {
    return { success: false, message: error.message };
  }

  if (!storyId) {
    return { success: false, message: "ID da história não fornecido." };
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("historias")
    .delete()
    .match({ id: storyId });

  if (error) {
    return {
      success: false,
      message: `Erro ao excluir história: ${error.message}`,
    };
  }

  revalidatePath("/historias");
  revalidatePath("/admin/historias");

  return { success: true, message: "História excluída com sucesso!" };
}

// --- GET STORY BY ID ---
export async function getStoryById(
  storyId: string
): Promise<{ story: Story | null; error?: string }> {
  console.log(
    "[storyActions] getStoryById chamado com ID:",
    storyId,
    "tipo:",
    typeof storyId
  );

  if (!storyId || storyId.trim() === "") {
    console.error("[storyActions] ID da história não fornecido ou vazio");
    return { story: null, error: "ID da história não fornecido." };
  }

  // Garantir que o ID seja uma string limpa
  const cleanId = storyId.trim();
  console.log("[storyActions] ID limpo:", cleanId);

  try {
    const supabase = await getSupabaseClient();
    console.log(
      "[storyActions] Cliente Supabase inicializado, buscando história com ID:",
      cleanId
    );

    const { data, error } = await supabase
      .from("historias")
      .select("*")
      .eq("id", cleanId)
      .single();

    console.log("[storyActions] Resposta do Supabase:", { data, error });

    if (error) {
      console.error("[storyActions] Erro ao buscar história:", error);
      return { story: null, error: error.message };
    }

    if (!data) {
      console.error(
        "[storyActions] Nenhum dado encontrado para o ID:",
        cleanId
      );
      return { story: null, error: "História não encontrada." };
    }

    console.log("[storyActions] História encontrada:", data);

    // Converter para o formato do tipo Story
    const story: Story = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      tags: data.tags || [],
      url: data.url,
      imageUrl: data.image_url,
      created_at: data.created_at,
    };

    console.log(
      "[storyActions] História convertida para o formato Story:",
      story
    );
    return { story };
  } catch (error: any) {
    console.error("[storyActions] Exceção ao buscar história:", error);
    return { story: null, error: `Erro ao buscar história: ${error.message}` };
  }
}
