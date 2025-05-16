"use server";

import { z } from "zod";
import { getSupabaseClient } from "./commonActions";
import { revalidatePath } from "next/cache";
import {
  ActionResponse,
  Inimigo,
  InimigoSchema,
  EditInimigoSchema,
  InimigoActionResponse,
} from "@/lib/types"; // Tipos a serem criados/definidos
import { verificarAdmin } from "./commonActions"; // Usar verificarAdmin de commonActions

// Schema para adicionar um inimigo (simplificado, pode ser igual ao InimigoSchema)
// Por enquanto, vamos assumir que InimigoSchema cobre a adição.

// Schema para editar um inimigo (pode ser o mesmo ou permitir campos parciais)
// Por enquanto, vamos assumir que EditInimigoSchema cobre a edição.

/**
 * Adiciona um novo inimigo ao banco de dados.
 * Apenas administradores podem adicionar inimigos.
 */
export async function addInimigo(
  formData: FormData
): Promise<InimigoActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message:
        "Acesso negado. Somente administradores podem adicionar inimigos.",
    };
  }

  const rawFormData = {
    nome: formData.get("nome") as string,
    status: (formData.get("status") as "pendente" | "vingado") || "pendente", // Default para pendente se não enviado
    // user_id será preenchido automaticamente ou pode ser pego da sessão se necessário na política
  };

  const validation = InimigoSchema.safeParse(rawFormData);

  if (!validation.success) {
    console.error(
      "Erro de validação ao adicionar inimigo:",
      validation.error.flatten()
    );
    return {
      success: false,
      message: "Erro de validação.",
      errors: validation.error.flatten().fieldErrors as any,
    };
  }

  const supabase = await getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: "Falha ao conectar com o banco de dados.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("inimigos")
      .insert([
        {
          nome: validation.data.nome,
          status: validation.data.status,
          // user_id: (await auth()).userId, // Se user_id for obrigatório e não default no DB
        },
      ])
      .select() // Para retornar o objeto inserido, se necessário
      .single(); // Assumindo que estamos inserindo um e queremos o retorno

    if (error) {
      console.error("Erro do Supabase ao adicionar inimigo:", error);
      return {
        success: false,
        message:
          error.message || "Erro ao adicionar inimigo no banco de dados.",
      };
    }

    revalidatePath("/inimigos");
    revalidatePath("/admin/inimigos");
    return { success: true, message: "Inimigo adicionado com sucesso!", data };
  } catch (e: any) {
    console.error("Exceção ao adicionar inimigo:", e);
    return {
      success: false,
      message: e.message || "Ocorreu um erro inesperado.",
    };
  }
}

/**
 * Busca todos os inimigos do banco de dados.
 */
export async function getInimigos(): Promise<Inimigo[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    console.error("Falha ao conectar com o banco de dados em getInimigos.");
    return [];
  }

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

/**
 * Busca um inimigo específico pelo ID.
 */
export async function getInimigoById(id: string): Promise<Inimigo | null> {
  if (!id) return null;

  const supabase = await getSupabaseClient();
  if (!supabase) {
    console.error("Falha ao conectar com o banco de dados em getInimigoById.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("inimigos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Se o erro for "PGRST116" (JSON object requested, multiple (or no) rows returned), significa que não encontrou ou encontrou mais de um.
      // Para "no rows returned", é esperado que retorne null.
      if (
        error.code !== "PGRST116" ||
        (error.code === "PGRST116" && !error.message.includes("multiple rows"))
      ) {
        return null;
      }
      return null;
    }
    return data;
  } catch (e: any) {
    console.error("Exceção ao buscar inimigo por ID:", e);
    return null;
  }
}

/**
 * Edita um inimigo existente.
 * Apenas administradores podem editar inimigos.
 */
export async function editInimigo(
  id: string,
  formData: FormData
): Promise<InimigoActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Acesso negado. Somente administradores podem editar inimigos.",
    };
  }

  const rawFormData = {
    nome: formData.get("nome") as string,
    status: formData.get("status") as "pendente" | "vingado",
  };

  // Usar EditInimigoSchema ou InimigoSchema dependendo da necessidade
  const validation = EditInimigoSchema.safeParse(rawFormData);

  if (!validation.success) {
    console.error(
      "Erro de validação ao editar inimigo:",
      validation.error.flatten()
    );
    return {
      success: false,
      message: "Erro de validação.",
      errors: validation.error.flatten().fieldErrors as any,
    };
  }

  const supabase = await getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: "Falha ao conectar com o banco de dados.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("inimigos")
      .update({
        nome: validation.data.nome,
        status: validation.data.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase ao editar inimigo:", error);
      return {
        success: false,
        message: error.message || "Erro ao editar inimigo.",
      };
    }

    revalidatePath("/inimigos");
    revalidatePath(`/admin/inimigos`);
    revalidatePath(`/inimigos/${id}`); // Se houver uma página de detalhe do inimigo
    return { success: true, message: "Inimigo atualizado com sucesso!", data };
  } catch (e: any) {
    console.error("Exceção ao editar inimigo:", e);
    return {
      success: false,
      message: e.message || "Ocorreu um erro inesperado ao editar.",
    };
  }
}

/**
 * Deleta um inimigo.
 * Apenas administradores podem deletar inimigos.
 */
export async function deleteInimigo(id: string): Promise<ActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Acesso negado. Somente administradores podem deletar inimigos.",
    };
  }

  const supabase = await getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: "Falha ao conectar com o banco de dados.",
    };
  }

  try {
    const { error } = await supabase.from("inimigos").delete().eq("id", id);

    if (error) {
      console.error("Erro do Supabase ao deletar inimigo:", error);
      return {
        success: false,
        message: error.message || "Erro ao deletar inimigo.",
      };
    }

    revalidatePath("/inimigos");
    revalidatePath("/admin/inimigos");
    return { success: true, message: "Inimigo deletado com sucesso!" };
  } catch (e: any) {
    console.error("Exceção ao deletar inimigo:", e);
    return {
      success: false,
      message: e.message || "Ocorreu um erro inesperado ao deletar.",
    };
  }
}
