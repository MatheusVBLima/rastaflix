"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  getSupabaseClient,
  verificarAdmin,
  ensureAdmin,
} from "./commonActions";
// Presumindo que estes tipos e schemas serão definidos em @/lib/types
import {
  ActionResponse,
  Esculacho,
  EsculachoSchema,
  EditEsculachoSchema,
} from "@/lib/types";

export async function getEsculachos(): Promise<Esculacho[]> {
  console.log("Buscando esculachos do Supabase...");
  const supabase = await getSupabaseClient();

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

  // Mapear os dados para a interface Esculacho (ajuste se necessário)
  return data.map((item) => ({
    ...item,
    id: item.id || "",
    titulo: item.titulo || "",
    conteudo: item.conteudo || "",
    // Campos opcionais podem precisar de tratamento se forem null no DB e undefined no tipo
    descricao: item.descricao,
    autor: item.autor,
  }));
}

export async function getEsculachoById(
  id: string
): Promise<{ esculacho?: Esculacho; error?: string }> {
  if (!id) {
    return { error: "ID do esculacho não fornecido" };
  }

  try {
    const supabase = await getSupabaseClient();
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

export async function addEsculacho(
  formData: FormData
): Promise<ActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para adicionar esculachos.",
    };
  }

  const rawData = {
    titulo: formData.get("titulo") as string,
    descricao: formData.get("descricao") as string | null,
    conteudo: formData.get("conteudo") as string,
    autor: formData.get("autor") as string | null,
  };

  try {
    const validatedData = EsculachoSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("esculachos")
      .insert([
        {
          titulo: validatedData.titulo,
          descricao: validatedData.descricao,
          conteudo: validatedData.conteudo,
          autor: validatedData.autor,
        },
      ])
      .select(); // .select() pode não ser necessário aqui se não usar o 'data' retornado

    if (error) {
      console.error("Erro Supabase ao adicionar esculacho:", error);
      return {
        success: false,
        message: `Erro ao salvar esculacho: ${error.message}`,
      };
    }

    revalidatePath("/esculachos"); // Rota da página de visualização pública
    revalidatePath("/admin/esculachos"); // Rota da página de admin

    return {
      success: true,
      message: `Esculacho "${validatedData.titulo}" adicionado com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do esculacho.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao adicionar esculacho:", error);
    return {
      success: false,
      message: "Erro ao adicionar esculacho. Tente novamente mais tarde.",
    };
  }
}

export async function editEsculacho(
  formData: FormData
): Promise<ActionResponse> {
  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para editar esculachos.",
    };
  }

  const rawData = {
    id: formData.get("id") as string,
    titulo: formData.get("titulo") as string,
    descricao: formData.get("descricao") as string | null,
    conteudo: formData.get("conteudo") as string,
    autor: formData.get("autor") as string | null,
  };

  try {
    const validatedData = EditEsculachoSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("esculachos")
      .update({
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        conteudo: validatedData.conteudo,
        autor: validatedData.autor,
      })
      .eq("id", validatedData.id);

    if (error) {
      console.error("Erro Supabase ao editar esculacho:", error);
      return {
        success: false,
        message: `Erro ao atualizar esculacho: ${error.message}`,
      };
    }

    revalidatePath("/esculachos");
    revalidatePath("/admin/esculachos");
    // Se tiver uma página de detalhe do esculacho, revalidar também:
    // revalidatePath(`/esculachos/${validatedData.id}`);

    return {
      success: true,
      message: `Esculacho "${validatedData.titulo}" atualizado com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do esculacho.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao editar esculacho:", error);
    return {
      success: false,
      message: "Erro ao editar esculacho. Tente novamente mais tarde.",
    };
  }
}

export async function deleteEsculacho(id: string): Promise<ActionResponse> {
  // Para delete, é bom garantir que apenas admins possam fazer
  // await ensureAdmin(); // Descomente se quiser lançar erro se não for admin

  const isAdmin = await verificarAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para excluir esculachos.",
    };
  }

  if (!id) {
    return {
      success: false,
      message: "ID do esculacho não fornecido.",
    };
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("esculachos").delete().eq("id", id);

    if (error) {
      console.error("Erro Supabase ao deletar esculacho:", error);
      return {
        success: false,
        message: `Erro ao excluir esculacho: ${error.message}`,
      };
    }

    revalidatePath("/esculachos");
    revalidatePath("/admin/esculachos");

    return {
      success: true,
      message: "Esculacho excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir esculacho:", error);
    return {
      success: false,
      message: "Erro ao excluir esculacho. Tente novamente mais tarde.",
    };
  }
}
