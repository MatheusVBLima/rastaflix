"use server";

import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getIsAdmin } from "@/lib/auth";

/**
 * Create a Supabase client configured for server-side use and Clerk integration.
 *
 * The client's `auth.accessToken` will attempt to obtain a Clerk token for authenticated requests; if token acquisition fails, the access token will be `null`.
 *
 * @returns A configured Supabase client suitable for use in Server Actions and Server Components
 */
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

/**
 * Check whether the current request's user has administrator privileges.
 *
 * @deprecated Prefer `getIsAdmin()` from `@/lib/auth` in Server Components.
 * @returns `true` if the current user is an admin, `false` otherwise.
 */
export async function verificarAdmin(): Promise<boolean> {
  return getIsAdmin();
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
