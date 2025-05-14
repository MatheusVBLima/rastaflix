import { z } from "zod";

// Esquema de Validação para Nova História (usado também para edição)
export const StorySchema = z.object({
  title: z.string().min(3, "Título precisa ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]), // Array de strings, opcional
  url: z.string().url("URL inválida."),
  imageUrl: z.union([
    z.string().url("URL da imagem inválida."), 
    z.literal("")
  ]).optional(), // Permite URL válida, string vazia, ou undefined (opcional)
  created_at: z.string().datetime().optional(), 
});

// Adicionar EditStorySchema aqui, estendendo StorySchema
export const EditStorySchema = StorySchema.extend({
  id: z.string().uuid("ID da história inválido."),
});

export interface ActionResponse {
  success: boolean;
  message: string;
  errors?: { field: string; message: string }[] | null;
  storyId?: string | null;
}

export interface Story { 
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  imageUrl?: string;
  created_at?: string;
} 