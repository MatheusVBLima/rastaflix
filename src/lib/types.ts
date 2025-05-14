import { z } from "zod";

// Esquema de Validação para Nova História (usado também para edição)
export const StorySchema = z.object({
  id: z.string().optional(), // ID é opcional quando criamos, mas obrigatório para edição
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  tags: z.string().optional(), // Na UI, tags são string separada por vírgulas
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
  title: z.string().min(3, { message: "O nome da música deve ter pelo menos 3 caracteres" }),
  url: z.string().url({ message: "URL inválida" }),
  imageUrl: z.string().url({ message: "URL da imagem inválida" }).optional(),
});

// Schema para editar músicas (exige ID)
export const EditMusicSchema = MusicSchema.extend({
  id: z.string({ required_error: "ID da música é obrigatório para edição" }),
});

export interface Story {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  imageUrl?: string;
  created_at?: string;
}

export interface Music {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  created_at?: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  errors?: { field: string; message: string }[];
  storyId?: string; // ID da história quando relevante
  musicId?: string; // ID da música quando relevante
}

export interface StoryActionResponse extends ActionResponse {
  story?: Story;
} 