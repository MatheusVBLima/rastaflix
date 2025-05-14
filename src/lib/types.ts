import { z } from "zod";

// Esquema de Validação para Nova História (usado também para edição)
export const StorySchema = z.object({
  id: z.string().optional(), // ID é opcional quando criamos, mas obrigatório para edição
  title: z
    .string()
    .min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  tags: z
    .union([
      z.string(), // Aceita string (formato do frontend)
      z.array(z.string()), // Aceita array (formato do backend)
    ])
    .optional(), // Na UI, tags são string separada por vírgulas, no backend é array
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
