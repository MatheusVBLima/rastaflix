import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client authenticated with the service role key.
 *
 * The returned client is configured with token auto-refresh and session persistence disabled.
 *
 * @returns A `SupabaseClient` authenticated using the service role key.
 * @throws Error if `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is not configured.
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
