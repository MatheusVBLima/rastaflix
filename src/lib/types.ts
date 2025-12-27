import { z } from "zod";

// Esquema de Validação para Nova História (usado também para edição)
export const StorySchema = z.object({
  id: z.string().optional(), // ID é opcional quando criamos, mas obrigatório para edição
  title: z
    .string()
    .min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(1, { message: "A descrição é obrigatória" }),
  tags: z
    .union([
      z.string().min(1, { message: "As tags são obrigatórias" }),
      z.array(z.string()).nonempty({ message: "As tags são obrigatórias" }),
    ])
    .refine(
      (data) => {
        if (typeof data === "string") return data.trim().length > 0;
        if (Array.isArray(data))
          return data.length > 0 && data.every((tag) => tag.trim().length > 0);
        return false;
      },
      { message: "As tags são obrigatórias e não podem conter apenas espaços." }
    ),
  url: z.string().url({ message: "URL inválida" }),
  imageUrl: z.string().url({ message: "URL da imagem inválida" }).optional(),
  created_at: z.string().datetime().optional(),
});

// Adicionar EditStorySchema aqui, estendendo StorySchema
export const EditStorySchema = StorySchema.extend({
  id: z.string({ required_error: "ID da história é obrigatório para edição" }),
});

// Schema para músicas
export const MusicSchema = z.object({
  id: z.string().optional(), // ID é opcional quando criamos, mas obrigatório para edição
  title: z.string().min(1, "O título é obrigatório."),
  url: z.string().url("Por favor, insira uma URL válida."),
  imageUrl: z.string().url("URL da imagem inválida.").nullable().optional(), // Tornando opcional e nula
});

// Tipo para os dados do formulário inferido do MusicSchema
export type MusicFormData = z.infer<typeof MusicSchema>;

// Schema para editar músicas (exige ID)
export const EditMusicSchema = MusicSchema.extend({
  id: z.string().min(1, "ID é obrigatório"),
});

export type EditMusicFormData = z.infer<typeof EditMusicSchema>;

export interface Story {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  imageUrl?: string | null;
  created_at?: string;
  user_id?: string;
}

export interface Music {
  id: string;
  title: string;
  url: string;
  imageUrl?: string | null;
  created_at?: string;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  storyId?: string;
  musicId?: string;
}

export interface StoryActionResponse extends ActionResponse {
  story?: Story;
}

// Tipos e Schemas para Esculachos

export interface Esculacho {
  id: string;
  titulo: string;
  descricao?: string | null;
  conteudo: string;
  autor?: string | null;
  audio_url?: string | null; // URL do áudio no Supabase Storage
  created_at: string;
}

export const EsculachoSchema = z.object({
  titulo: z.string().min(1, { message: "Título é obrigatório." }),
  conteudo: z.string().min(1, { message: "Conteúdo é obrigatório." }),
  descricao: z.string().min(1, { message: "Descrição é obrigatória." }),
  autor: z.string().min(1, { message: "Autor é obrigatório." }),
});

export type EsculachoFormData = z.infer<typeof EsculachoSchema>;

export const EditEsculachoSchema = EsculachoSchema.extend({
  id: z.string().uuid({
    message: "ID do esculacho é obrigatório e deve ser um UUID válido.",
  }),
});

// Se você precisar de um tipo específico para os dados do formulário de edição
// que inclua o ID, mas talvez não outros campos que o schema base tem:
// export type EditEsculachoFormData = z.infer<typeof EditEsculachoSchema>;
// Mas geralmente, o formulário de edição preencherá os campos do EsculachoSchema
// e o ID será gerenciado separadamente ou incluído no schema de validação final.

// Tipos e Schemas para Inimigos
export const InimigoStatusSchema = z.enum(["pendente", "vingado"], {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { message: "Status inválido. Use 'pendente' ou 'vingado'." };
    }
    return { message: ctx.defaultError };
  },
});

export interface Inimigo {
  id: string;
  nome: string;
  status: z.infer<typeof InimigoStatusSchema>; // "pendente" | "vingado"
  created_at: string;
  user_id?: string | null; // Adicionado conforme a tabela SQL
}

export const InimigoSchema = z.object({
  nome: z.string().min(1, { message: "Nome é obrigatório." }),
  status: InimigoStatusSchema,
});

export type InimigoFormData = z.infer<typeof InimigoSchema>;

export const EditInimigoSchema = InimigoSchema.extend({
  // Para edição, o ID geralmente vem separado ou não faz parte da validação do formData em si,
  // mas sim da lógica da action. Se quiser validar o ID no schema de edição, adicione:
  // id: z.string().uuid({ message: "ID do inimigo é obrigatório e deve ser um UUID válido." }),
});

// Interface específica para respostas de actions de Inimigo que podem retornar o objeto Inimigo
export interface InimigoActionResponse extends ActionResponse {
  data?: Inimigo; // Ou Inimigo[] se a action puder retornar múltiplos
}

// export interface ActionResult {
//   success: boolean;
//   message?: string;
//   errors?: Record<string, string[]> | { _form?: string[] } | null;
//   data?: any;
// }

// ============================================
// RASTA AWARDS - Types & Schemas
// ============================================

// ========== Award Season ==========
export interface AwardSeason {
  id: string;
  year: number;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "closed";
  created_at?: string;
  updated_at?: string;
}

export const AwardSeasonSchema = z.object({
  year: z
    .number()
    .int({ message: "Ano deve ser um número inteiro" })
    .min(2020, { message: "Ano deve ser maior que 2020" })
    .max(2100, { message: "Ano deve ser menor que 2100" }),
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Data de início é obrigatória" }),
  end_date: z.string().min(1, { message: "Data de término é obrigatória" }),
  status: z.enum(["draft", "active", "closed"], {
    message: "Status deve ser draft, active ou closed",
  }),
});

export const EditAwardSeasonSchema = AwardSeasonSchema.extend({
  id: z
    .string()
    .uuid({ message: "ID deve ser um UUID válido" })
    .min(1, { message: "ID é obrigatório para edição" }),
});

export type AwardSeasonFormData = z.infer<typeof AwardSeasonSchema>;
export type EditAwardSeasonFormData = z.infer<typeof EditAwardSeasonSchema>;

// ========== Award Category ==========
export interface AwardCategory {
  id: string;
  season_id: string;
  name: string;
  description?: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export const AwardCategorySchema = z.object({
  season_id: z.string().uuid({ message: "ID da temporada é obrigatório" }),
  name: z
    .string()
    .min(1, { message: "Nome da categoria é obrigatório" })
    .max(100, { message: "Nome não pode exceder 100 caracteres" }),
  description: z.string().optional(),
  display_order: z
    .number()
    .int({ message: "Ordem deve ser um número inteiro" })
    .default(0),
});

export const EditAwardCategorySchema = AwardCategorySchema.extend({
  id: z
    .string()
    .uuid({ message: "ID deve ser um UUID válido" })
    .min(1, { message: "ID é obrigatório para edição" }),
});

export type AwardCategoryFormData = z.infer<typeof AwardCategorySchema>;
export type EditAwardCategoryFormData = z.infer<typeof EditAwardCategorySchema>;

// ========== Award Nominee ==========
export interface AwardNominee {
  id: string;
  category_id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  content_link?: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export const AwardNomineeSchema = z.object({
  category_id: z.string().uuid({ message: "ID da categoria é obrigatório" }),
  title: z
    .string()
    .min(1, { message: "Título do nominee é obrigatório" })
    .max(200, { message: "Título não pode exceder 200 caracteres" }),
  description: z.string().optional(),
  image_url: z
    .string()
    .url({ message: "URL da imagem inválida" })
    .optional()
    .or(z.literal("")),
  content_link: z
    .string()
    .url({ message: "URL do conteúdo inválida" })
    .optional()
    .or(z.literal("")),
  display_order: z
    .number()
    .int({ message: "Ordem deve ser um número inteiro" })
    .default(0),
});

export const EditAwardNomineeSchema = AwardNomineeSchema.extend({
  id: z
    .string()
    .uuid({ message: "ID deve ser um UUID válido" })
    .min(1, { message: "ID é obrigatório para edição" }),
});

export type AwardNomineeFormData = z.infer<typeof AwardNomineeSchema>;
export type EditAwardNomineeFormData = z.infer<typeof EditAwardNomineeSchema>;

// ========== Award Vote ==========
export interface AwardVote {
  id: string;
  user_id: string;
  category_id: string;
  nominee_id: string;
  season_id: string;
  created_at?: string;
  updated_at?: string;
}

export const VoteSchema = z.object({
  category_id: z.string().uuid({ message: "ID da categoria é obrigatório" }),
  nominee_id: z.string().uuid({ message: "ID do nominee é obrigatório" }),
  season_id: z.string().uuid({ message: "ID da temporada é obrigatório" }),
});

export type VoteFormData = z.infer<typeof VoteSchema>;

// ========== Vote Results (Admin Only) ==========
export interface VoteResults {
  nominee_id: string;
  nominee_title: string;
  nominee_description?: string | null;
  nominee_image_url?: string | null;
  nominee_content_link?: string | null;
  vote_count: number;
  percentage: number;
}

export interface CategoryWithResults extends AwardCategory {
  nominees: (AwardNominee & { vote_count?: number; percentage?: number })[];
  total_votes: number;
}

// ========== Voting Data (Public) ==========
export interface CategoryWithNominees extends AwardCategory {
  nominees: AwardNominee[];
}

export interface VotingData {
  season: AwardSeason;
  categories: CategoryWithNominees[];
}

// ========== Response Types ==========
export interface AwardSeasonActionResponse extends ActionResponse {
  seasonId?: string;
  season?: AwardSeason;
}

export interface AwardCategoryActionResponse extends ActionResponse {
  categoryId?: string;
  category?: AwardCategory;
}

export interface AwardNomineeActionResponse extends ActionResponse {
  nomineeId?: string;
  nominee?: AwardNominee;
}

export interface VoteActionResponse extends ActionResponse {
  voteId?: string;
  vote?: AwardVote;
  voted?: boolean;
}

// ============================================
// USER ACHIEVEMENTS - Types & Schemas
// ============================================

export type AchievementType = "rasta_awards_voter" | "other";

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achievement_year: number;
  achievement_data?: {
    season_id?: string;
    season_title?: string;
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface UserAchievementActionResponse extends ActionResponse {
  achievement?: UserAchievement;
}

// ============================================
// STREAMER CONFIG & CLIPES - Types & Schemas
// ============================================

// ========== Streamer Config (Live Status) ==========
export interface StreamerConfig {
  id: string;
  twitch_username: string;
  kick_username: string;
  twitch_user_id?: string | null;
  is_live_twitch: boolean;
  is_live_kick: boolean;
  twitch_stream_title?: string | null;
  kick_stream_title?: string | null;
  twitch_viewer_count?: number | null;
  kick_viewer_count?: number | null;
  twitch_thumbnail_url?: string | null;
  kick_thumbnail_url?: string | null;
  last_twitch_update?: string | null;
  last_kick_update?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ========== Clipes ==========
export type ClipePlatform = "twitch" | "kick";

export interface Clipe {
  id: string;
  titulo: string;
  url: string;
  thumbnail_url?: string | null;
  plataforma: ClipePlatform;
  created_at?: string;
}

export const ClipeSchema = z.object({
  titulo: z.string().min(1, { message: "Título é obrigatório." }),
  url: z.string().url({ message: "URL inválida." }),
  thumbnail_url: z.string().url({ message: "URL da thumbnail inválida." }).optional().or(z.literal("")),
  plataforma: z.enum(["twitch", "kick"], {
    errorMap: () => ({ message: "Plataforma deve ser twitch ou kick." }),
  }),
});

export const EditClipeSchema = ClipeSchema.extend({
  id: z.string().uuid({ message: "ID do clipe é obrigatório e deve ser um UUID válido." }),
});

export type ClipeFormData = z.infer<typeof ClipeSchema>;
export type EditClipeFormData = z.infer<typeof EditClipeSchema>;

export interface ClipeActionResponse extends ActionResponse {
  clipeId?: string;
  clipe?: Clipe;
}
