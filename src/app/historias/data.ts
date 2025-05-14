import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export interface Story {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  imageUrl?: string; // Opcional: para uma imagem no card
  created_at?: string; // Adicionando created_at se quisermos usar para ordenação
}

// Helper para criar cliente Supabase em Server Components
// Similar ao usado em Server Actions
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function getHistorias(): Promise<Story[]> {
  console.log("Buscando histórias reais do Supabase...");
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('historias')
    .select('id, title, description, tags, url, image_url, created_at') // Selecionar colunas explicitamente
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórias do Supabase:', error);
    return []; // Retorna array vazio em caso de erro
  }

  if (!data) {
    return [];
  }
  
  // Mapear os dados para a interface Story, especialmente image_url -> imageUrl
  return data.map(story => ({
    ...story,
    description: story.description || "", // Garantir que description seja string
    tags: story.tags || [], // Garantir que tags seja array
    imageUrl: story.image_url, // Mapeamento direto
  }));
}

// Função para obter todas as tags únicas das histórias
export function getAllTags(historias: Story[]): string[] {
  const allTags = new Set<string>();
  historias.forEach(story => {
    story.tags.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
} 