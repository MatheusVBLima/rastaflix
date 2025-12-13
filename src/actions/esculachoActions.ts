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

// NOTA: getEsculachos() e getEsculachoById() foram movidos para @/lib/queries
// Para buscar esculachos, use: import { fetchEsculachos, fetchEsculachoById } from '@/lib/queries'

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

  // Audio base64 vem separado - salvar diretamente no banco
  const audioBase64 = formData.get("audioBase64") as string | null;

  try {
    const validatedData = EsculachoSchema.parse(rawData);

    const supabase = await getSupabaseClient();

    const { error: insertError } = await supabase
      .from("esculachos")
      .insert([
        {
          titulo: validatedData.titulo,
          descricao: validatedData.descricao,
          conteudo: validatedData.conteudo,
          autor: validatedData.autor,
          audio_data: audioBase64, // Salva base64 diretamente no banco
        },
      ]);

    if (insertError) {
      console.error("Erro Supabase ao adicionar esculacho:", insertError);
      return {
        success: false,
        message: `Erro ao salvar esculacho: ${insertError.message}`,
      };
    }

    revalidatePath("/esculachos");
    revalidatePath("/admin/esculachos");

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

  // Audio base64 vem separado (novo áudio gerado) - salvar diretamente no banco
  const audioBase64 = formData.get("audioBase64") as string | null;

  try {
    const validatedData = EditEsculachoSchema.parse(rawData);

    const supabase = await getSupabaseClient();

    // Dados para atualizar
    const updateData: {
      titulo: string;
      descricao: string | null | undefined;
      conteudo: string;
      autor: string | null | undefined;
      audio_data?: string;
    } = {
      titulo: validatedData.titulo,
      descricao: validatedData.descricao,
      conteudo: validatedData.conteudo,
      autor: validatedData.autor,
    };

    // Se tem novo áudio, adicionar ao update
    if (audioBase64) {
      updateData.audio_data = audioBase64;
    }

    const { error } = await supabase
      .from("esculachos")
      .update(updateData)
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
