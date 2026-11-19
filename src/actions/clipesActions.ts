"use server";

import {
  ClipeSchema,
  EditClipeSchema,
  ClipeActionResponse,
} from "@/lib/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getIsAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function addClipe(formData: FormData): Promise<ClipeActionResponse> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para adicionar clipes.",
    };
  }

  const rawData = {
    titulo: formData.get("titulo") as string,
    url: formData.get("url") as string,
    thumbnail_url: (formData.get("thumbnail_url") as string) || "",
    plataforma: formData.get("plataforma") as string,
    archived: formData.get("archived") === "true",
  };

  try {
    const validatedData = ClipeSchema.parse(rawData);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clipes")
      .insert([
        {
          titulo: validatedData.titulo,
          url: validatedData.url,
          thumbnail_url: validatedData.thumbnail_url || null,
          plataforma: validatedData.plataforma,
          archived: validatedData.archived ?? false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao salvar clipe: ${error.message}`,
      };
    }

    revalidatePath("/clipes");
    revalidatePath("/admin/clipes");

    return {
      success: true,
      message: `Clipe "${validatedData.titulo}" adicionado com sucesso!`,
      clipeId: data?.id,
      clipe: data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do clipe.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao adicionar clipe:", error);
    return {
      success: false,
      message: "Erro ao adicionar clipe. Tente novamente mais tarde.",
    };
  }
}

export async function editClipe(formData: FormData): Promise<ClipeActionResponse> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para editar clipes.",
    };
  }

  const rawData = {
    id: formData.get("id") as string,
    titulo: formData.get("titulo") as string,
    url: formData.get("url") as string,
    thumbnail_url: (formData.get("thumbnail_url") as string) || "",
    plataforma: formData.get("plataforma") as string,
    archived: formData.get("archived") === "true",
  };

  try {
    const validatedData = EditClipeSchema.parse(rawData);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clipes")
      .update({
        titulo: validatedData.titulo,
        url: validatedData.url,
        thumbnail_url: validatedData.thumbnail_url || null,
        plataforma: validatedData.plataforma,
        archived: validatedData.archived ?? false,
      })
      .eq("id", validatedData.id)
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao atualizar clipe: ${error.message}`,
      };
    }

    revalidatePath("/clipes");
    revalidatePath("/admin/clipes");

    return {
      success: true,
      message: `Clipe "${validatedData.titulo}" atualizado com sucesso!`,
      clipeId: data?.id,
      clipe: data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do clipe.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao editar clipe:", error);
    return {
      success: false,
      message: "Erro ao editar clipe. Tente novamente mais tarde.",
    };
  }
}

export async function setClipeArchived(
  id: string,
  archived: boolean
): Promise<ClipeActionResponse> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para alterar o status de clipes.",
    };
  }

  if (!id) {
    return { success: false, message: "ID do clipe não fornecido." };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("clipes")
      .update({ archived })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        message: `Erro ao atualizar status do clipe: ${error.message}`,
      };
    }

    revalidatePath("/clipes");
    revalidatePath("/admin/clipes");

    return {
      success: true,
      message: archived
        ? "Clipe arquivado. Ele não aparece mais para os usuários."
        : "Clipe reativado e visível novamente no site.",
    };
  } catch (error) {
    console.error("Erro ao alterar status do clipe:", error);
    return {
      success: false,
      message: "Erro ao alterar status do clipe. Tente novamente mais tarde.",
    };
  }
}

export async function deleteClipe(id: string): Promise<ClipeActionResponse> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: "Você não tem permissão para excluir clipes.",
    };
  }

  if (!id) {
    return {
      success: false,
      message: "ID do clipe não fornecido",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("clipes").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        message: `Erro ao excluir clipe: ${error.message}`,
      };
    }

    revalidatePath("/clipes");
    revalidatePath("/admin/clipes");

    return {
      success: true,
      message: "Clipe excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir clipe:", error);
    return {
      success: false,
      message: "Erro ao excluir clipe. Tente novamente mais tarde.",
    };
  }
}
