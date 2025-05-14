"use server";

import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";

// Helper para criar cliente Supabase em Server Actions/Server Components
export async function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      async accessToken() {
        try {
          const { getToken } = await auth();
          const token = await getToken();
          return token;
        } catch (error) {
          console.error("Erro ao obter token do Clerk para Supabase:", error);
          return null;
        }
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
