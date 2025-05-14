"use server";

import { z } from "zod";
import { createServerClient } from "@supabase/ssr"; // Usaremos este para Supabase
import { cookies } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StorySchema, ActionResponse, Story, EditStorySchema } from "@/lib/types"; // Importar Story diretamente

// Esquema de Validação para Nova História - REMOVIDO, importado de types.ts
// export const StorySchema = z.object({ ... });

// Helper para criar cliente Supabase em Server Actions/Server Components
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
// Se você for usar a service_role key para operações de admin (bypass RLS):
// import { createClient } from '@supabase/supabase-js';
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );


// Função para verificar se o usuário é admin
async function ensureAdmin() {
  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }
  
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  if (user.privateMetadata?.is_admin !== true) {
    throw new Error("Acesso negado. Requer privilégios de administrador.");
  }
  return userId;
}

// ActionResponse Interface - REMOVIDA, importada de types.ts
// export interface ActionResponse { ... }

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
    tags: formData.get("tags") ? (formData.get("tags") as string).split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    url: formData.get("url"),
    imageUrl: formData.get("imageUrl"),
  };

  const validatedFields = StorySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Erro de validação. Verifique os campos.",
      errors: Object.entries(validatedFields.error.flatten().fieldErrors).map(
        ([field, messages]: [string, string[] | undefined]) => ({ field, message: (messages || [])[0] || "Erro desconhecido" })
      ),
    };
  }

  const supabase = await createSupabaseServerClient();

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
    return { success: false, message: `Erro ao adicionar história: ${error.message}` };
  }

  revalidatePath("/historias");
  revalidatePath("/admin/historias");
  
  return { 
    success: true, 
    message: "História adicionada com sucesso!",
    storyId: data?.id
  };
}

// --- EDIT STORY ---
// REMOVER EditStorySchema daqui - foi movido para src/lib/types.ts
// export const EditStorySchema = StorySchema.extend({ ... });

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
    tags: formData.get("tags") ? (formData.get("tags") as string).split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    url: formData.get("url"),
    imageUrl: formData.get("imageUrl"),
  };

  const validatedFields = EditStorySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Erro de validação.",
      errors: Object.entries(validatedFields.error.flatten().fieldErrors).map(
        ([field, messages]: [string, string[] | undefined]) => ({ field, message: (messages || [])[0] || "Erro desconhecido" })
      ),
    };
  }
  
  const supabase = await createSupabaseServerClient();
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
    return { success: false, message: `Erro ao editar história: ${error.message}` };
  }

  revalidatePath("/historias");
  revalidatePath(`/historias/${validatedFields.data.id}`);
  revalidatePath("/admin/historias");
  
  return { success: true, message: "História atualizada com sucesso!" };
}


// --- DELETE STORY ---
export async function deleteStory(
  storyId: string
): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error: any) {
    return { success: false, message: error.message };
  }

  if (!storyId) {
    return { success: false, message: "ID da história não fornecido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("historias")
    .delete()
    .eq("id", storyId);

  if (error) {
    return { success: false, message: `Erro ao deletar história: ${error.message}` };
  }

  revalidatePath("/historias");
  revalidatePath("/admin");
  
  return { success: true, message: "História deletada com sucesso!" };
}

// --- GET STORY BY ID ---
export async function getStoryById(storyId: string): Promise<{ story: Story | null; error?: string }> {
  if (!storyId) {
    return { story: null, error: "ID da história não fornecido." };
  }

  // Não é estritamente necessário verificar admin para um GET simples se a página já é protegida,
  // mas pode ser uma camada extra se esta action for chamada de contextos não protegidos.
  // Por simplicidade, vamos assumir que a proteção da rota/página é suficiente para um GET.
  // Se for para uma action que modifica dados, ensureAdmin() é crucial.
  
  // A autenticação básica ainda é uma boa ideia para garantir que apenas usuários logados possam chamar.
  const authResult = await auth();
  if (!authResult.userId) {
    return { story: null, error: "Usuário não autenticado." };
  }
  
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("historias")
      .select("id, title, description, tags, url, image_url, created_at")
      .eq("id", storyId)
      .single(); // Esperamos apenas um resultado

    if (error) {
      console.error("Supabase error fetching story by ID:", error);
      return { story: null, error: `Erro ao buscar história: ${error.message}` };
    }

    if (!data) {
      return { story: null, error: "História não encontrada." };
    }

    // Mapear para a interface Story
    const storyData: Story = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      tags: data.tags || [],
      url: data.url,
      imageUrl: data.image_url || undefined, // Mapear image_url e garantir que seja undefined se null/vazio
      created_at: data.created_at
    };
    
    return { story: storyData };

  } catch (e: any) {
    console.error("Exception in getStoryById:", e);
    return { story: null, error: "Ocorreu um erro inesperado ao buscar a história." };
  }
}

