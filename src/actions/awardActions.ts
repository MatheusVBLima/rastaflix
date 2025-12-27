"use server";

import {
  AwardSeasonSchema,
  EditAwardSeasonSchema,
  AwardCategorySchema,
  EditAwardCategorySchema,
  AwardNomineeSchema,
  EditAwardNomineeSchema,
  VoteSchema,
  ActionResponse,
  VoteActionResponse,
} from "@/lib/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSupabaseClient, ensureAdmin } from "./commonActions";
import { auth } from "@clerk/nextjs/server";

// ========================================
// SEASON ACTIONS (Admin Only)
// ========================================

export async function addSeason(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para adicionar temporadas.",
    };
  }

  const rawData = {
    year: parseInt(formData.get("year") as string),
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    status: formData.get("status") as "draft" | "active" | "closed",
  };

  try {
    const validatedData = AwardSeasonSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("award_seasons").insert([
      {
        year: validatedData.year,
        title: validatedData.title,
        description: validatedData.description || null,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        status: validatedData.status,
      },
    ]);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao salvar temporada: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: `Temporada "${validatedData.title}" adicionada com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados da temporada.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao adicionar temporada:", error);
    return {
      success: false,
      message: "Erro ao adicionar temporada. Tente novamente mais tarde.",
    };
  }
}

export async function editSeason(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para editar temporadas.",
    };
  }

  const rawData = {
    id: formData.get("id") as string,
    year: parseInt(formData.get("year") as string),
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    status: formData.get("status") as "draft" | "active" | "closed",
  };

  try {
    const validatedData = EditAwardSeasonSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("award_seasons")
      .update({
        year: validatedData.year,
        title: validatedData.title,
        description: validatedData.description || null,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedData.id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao editar temporada: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: `Temporada "${validatedData.title}" editada com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados da temporada.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao editar temporada:", error);
    return {
      success: false,
      message: "Erro ao editar temporada. Tente novamente mais tarde.",
    };
  }
}

export async function deleteSeason(id: string): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para deletar temporadas.",
    };
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("award_seasons").delete().eq("id", id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao deletar temporada: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: "Temporada deletada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao deletar temporada:", error);
    return {
      success: false,
      message: "Erro ao deletar temporada. Tente novamente mais tarde.",
    };
  }
}

// ========================================
// CATEGORY ACTIONS (Admin Only)
// ========================================

export async function addCategory(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para adicionar categorias.",
    };
  }

  const rawData = {
    season_id: formData.get("season_id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string || undefined,
    display_order: parseInt(formData.get("display_order") as string) || 0,
  };

  try {
    const validatedData = AwardCategorySchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("award_categories").insert([
      {
        season_id: validatedData.season_id,
        name: validatedData.name,
        description: validatedData.description || null,
        display_order: validatedData.display_order,
      },
    ]);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao salvar categoria: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: `Categoria "${validatedData.name}" adicionada com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados da categoria.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao adicionar categoria:", error);
    return {
      success: false,
      message: "Erro ao adicionar categoria. Tente novamente mais tarde.",
    };
  }
}

export async function editCategory(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para editar categorias.",
    };
  }

  const rawData = {
    id: formData.get("id") as string,
    season_id: formData.get("season_id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string || undefined,
    display_order: parseInt(formData.get("display_order") as string) || 0,
  };

  try {
    const validatedData = EditAwardCategorySchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("award_categories")
      .update({
        season_id: validatedData.season_id,
        name: validatedData.name,
        description: validatedData.description || null,
        display_order: validatedData.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedData.id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao editar categoria: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: `Categoria "${validatedData.name}" editada com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados da categoria.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao editar categoria:", error);
    return {
      success: false,
      message: "Erro ao editar categoria. Tente novamente mais tarde.",
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para deletar categorias.",
    };
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("award_categories").delete().eq("id", id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao deletar categoria: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: "Categoria deletada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    return {
      success: false,
      message: "Erro ao deletar categoria. Tente novamente mais tarde.",
    };
  }
}

// ========================================
// NOMINEE ACTIONS (Admin Only)
// ========================================

export async function addNominee(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para adicionar nominados.",
    };
  }

  const rawData = {
    category_id: formData.get("category_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    image_url: formData.get("image_url") as string || undefined,
    content_link: formData.get("content_link") as string || undefined,
    display_order: parseInt(formData.get("display_order") as string) || 0,
  };

  try {
    const validatedData = AwardNomineeSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("award_nominees").insert([
      {
        category_id: validatedData.category_id,
        title: validatedData.title,
        description: validatedData.description || null,
        image_url: validatedData.image_url || null,
        content_link: validatedData.content_link || null,
        display_order: validatedData.display_order,
      },
    ]);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao salvar nominado: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: `Nominado "${validatedData.title}" adicionado com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do nominado.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao adicionar nominado:", error);
    return {
      success: false,
      message: "Erro ao adicionar nominado. Tente novamente mais tarde.",
    };
  }
}

export async function editNominee(formData: FormData): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para editar nominados.",
    };
  }

  const rawData = {
    id: formData.get("id") as string,
    category_id: formData.get("category_id") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    image_url: formData.get("image_url") as string || undefined,
    content_link: formData.get("content_link") as string || undefined,
    display_order: parseInt(formData.get("display_order") as string) || 0,
  };

  try {
    const validatedData = EditAwardNomineeSchema.parse(rawData);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("award_nominees")
      .update({
        category_id: validatedData.category_id,
        title: validatedData.title,
        description: validatedData.description || null,
        image_url: validatedData.image_url || null,
        content_link: validatedData.content_link || null,
        display_order: validatedData.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedData.id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao editar nominado: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: `Nominado "${validatedData.title}" editado com sucesso!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do nominado.",
        errors: fieldErrors,
      };
    }
    console.error("Erro ao editar nominado:", error);
    return {
      success: false,
      message: "Erro ao editar nominado. Tente novamente mais tarde.",
    };
  }
}

export async function deleteNominee(id: string): Promise<ActionResponse> {
  try {
    await ensureAdmin();
  } catch (error) {
    return {
      success: false,
      message: "Você não tem permissão para deletar nominados.",
    };
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("award_nominees").delete().eq("id", id);

    if (error) {
      console.error("Erro Supabase:", error);
      return {
        success: false,
        message: `Erro ao deletar nominado: ${error.message}`,
      };
    }

    revalidatePath("/admin/rasta-awards");

    return {
      success: true,
      message: "Nominado deletado com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao deletar nominado:", error);
    return {
      success: false,
      message: "Erro ao deletar nominado. Tente novamente mais tarde.",
    };
  }
}

// ========================================
// VOTING ACTIONS (Public - Authenticated Users)
// ========================================

export async function submitVote(
  formData: FormData
): Promise<VoteActionResponse> {
  // 1. Verificar autenticação
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      message: "Você precisa estar logado para votar.",
    };
  }

  const rawData = {
    category_id: formData.get("category_id") as string,
    nominee_id: formData.get("nominee_id") as string,
    season_id: formData.get("season_id") as string,
  };

  try {
    const validatedData = VoteSchema.parse(rawData);

    const supabase = await getSupabaseClient();

    // 2. Verificar se a temporada está ativa
    const { data: season, error: seasonError } = await supabase
      .from("award_seasons")
      .select("status, year, title")
      .eq("id", validatedData.season_id)
      .single();

    if (seasonError || !season) {
      return {
        success: false,
        message: "Temporada não encontrada.",
      };
    }

    if (season.status !== "active") {
      return {
        success: false,
        message: "A votação desta temporada não está ativa.",
      };
    }

    // 3. UPSERT: Inserir ou atualizar voto
    const { error: upsertError } = await supabase
      .from("award_votes")
      .upsert(
        {
          user_id: userId,
          category_id: validatedData.category_id,
          nominee_id: validatedData.nominee_id,
          season_id: validatedData.season_id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,category_id",
        }
      );

    if (upsertError) {
      console.error("Erro Supabase:", upsertError);
      return {
        success: false,
        message: `Erro ao registrar voto: ${upsertError.message}`,
      };
    }

    // 4. Award achievement badge for voting in Rasta Awards
    const { error: achievementError } = await supabase
      .from("user_achievements")
      .upsert(
        {
          user_id: userId,
          achievement_type: "rasta_awards_voter",
          achievement_year: season.year || new Date().getFullYear(),
          achievement_data: {
            season_id: validatedData.season_id,
            season_title: season.title || `Rasta Awards ${season.year || new Date().getFullYear()}`,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,achievement_type,achievement_year",
        }
      );

    if (achievementError) {
      console.error("Erro ao conceder conquista:", achievementError);
      // Don't fail the vote if achievement fails, just log it
    }

    revalidatePath("/rasta-awards");
    revalidatePath("/perfil");

    return {
      success: true,
      message: "Voto registrado com sucesso!",
      voted: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return {
        success: false,
        message: "Erro de validação nos dados do voto.",
        errors: fieldErrors,
        voted: false,
      };
    }
    console.error("Erro ao registrar voto:", error);
    return {
      success: false,
      message: "Erro ao registrar voto. Tente novamente mais tarde.",
      voted: false,
    };
  }
}
