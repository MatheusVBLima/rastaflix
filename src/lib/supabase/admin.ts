import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client authenticated with the service role key (bypasses RLS).
 *
 * Server-only. Every write in the app goes through this client, so callers
 * MUST authorize the request first (`ensureAdmin()` for content, `auth()` for votes).
 */
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL or Service Role Key not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
