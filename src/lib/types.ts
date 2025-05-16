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
