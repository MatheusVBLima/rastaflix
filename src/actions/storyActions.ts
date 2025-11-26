"use server";

import { revalidatePath } from "next/cache";
import {
  StorySchema,
  ActionResponse,
  Story,
  EditStorySchema,
} from "@/lib/types";
import { getSupabaseClient, ensureAdmin } from "./commonActions";

// NOTA: getHistorias() e getAllTags() foram movidos para @/lib/queries
// Para buscar histórias, use: import { fetchHistorias, getAllTags } from '@/lib/queries'

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

// NOTA: getStoryById() foi movido para @/lib/queries
// Para buscar história por ID, use: import { fetchStoryById } from '@/lib/queries'
