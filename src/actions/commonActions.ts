"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Helper para criar cliente Supabase em Server Actions/Server Components
export async function getSupabaseClient() {
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

// Verificação de administrador
export async function verificarAdmin(): Promise<boolean> {
  const authState = await auth();
  if (!authState.userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(authState.userId);
    return user.privateMetadata?.is_admin === true;
  } catch {
    return false;
  }
}

// Função para verificar se o usuário é admin e lançar erro se não for
export async function ensureAdmin(): Promise<string> {
  const authState = await auth();
  const userId = authState.userId;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }
  
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  
  if (user.privateMetadata?.is_admin !== true) {
    throw new Error("Acesso negado. Requer privilégios de administrador.");
  }
  return userId;
} 