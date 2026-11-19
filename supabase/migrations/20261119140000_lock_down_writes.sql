-- Lock down all client-side writes.
--
-- Before: RLS let ANY signed-in Clerk user (role `authenticated`) insert/update/delete
-- content, other users' votes, and achievements directly via PostgREST, and let anyone
-- (even anon) write to the esculachos-audio bucket.
--
-- After: anon/authenticated can only READ. Every write goes through Server Actions /
-- Route Handlers using the service role (which bypasses RLS) after `ensureAdmin()`
-- (content) or Clerk `auth()` (votes/achievements).

-- 1. Drop every write policy on app tables -------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'historias', 'musicas', 'esculachos', 'inimigos', 'clipes', 'streamer_config',
        'award_seasons', 'award_categories', 'award_nominees', 'award_votes',
        'user_achievements'
      )
      and cmd <> 'SELECT'
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 2. Defense in depth: remove write grants from API roles ----------------------------
revoke insert, update, delete, truncate on table
  public.historias, public.musicas, public.esculachos, public.inimigos, public.clipes,
  public.streamer_config, public.award_seasons, public.award_categories,
  public.award_nominees, public.award_votes, public.user_achievements
from anon, authenticated;

-- 3. Storage: only the service role may write audio files ----------------------------
drop policy if exists "Authenticated upload for esculachos audio" on storage.objects;
drop policy if exists "Authenticated update for esculachos audio" on storage.objects;
drop policy if exists "Authenticated delete for esculachos audio" on storage.objects;

-- 4. AI tables / functions (unused by the app code): no anonymous or client access ----
revoke all on table public."AIUsage", public."UserAIQuota" from anon;
revoke insert, update, delete, truncate on table public."AIUsage", public."UserAIQuota" from authenticated;

revoke execute on function
  public.check_or_initialize_user_quota(text, text),
  public.get_costs_by_user(),
  public.get_total_ai_costs(),
  public.increment_ai_usage(text, text, bigint, numeric),
  public.log_ai_usage(text, text, text, integer, integer, integer, numeric, boolean, text, text)
from public, anon, authenticated;

alter function public.check_or_initialize_user_quota(text, text) set search_path = public;
alter function public.get_costs_by_user() set search_path = public;
alter function public.get_total_ai_costs() set search_path = public;
alter function public.increment_ai_usage(text, text, bigint, numeric) set search_path = public;
alter function public.log_ai_usage(text, text, text, integer, integer, integer, numeric, boolean, text, text) set search_path = public;

-- service_role has BYPASSRLS, so these policies were redundant (and slowed every SELECT).
drop policy if exists "Service role has full access to AIUsage" on public."AIUsage";
drop policy if exists "Service role has full access to UserAIQuota" on public."UserAIQuota";

drop policy if exists "Users can view their own AI usage" on public."AIUsage";
create policy "Users can view their own AI usage" on public."AIUsage"
  for select to authenticated using ((select auth.uid())::text = "userId");

drop policy if exists "Users can view their own quota" on public."UserAIQuota";
create policy "Users can view their own quota" on public."UserAIQuota"
  for select to authenticated using ((select auth.uid())::text = "userId");

-- 5. Missing FK index ---------------------------------------------------------------
create index if not exists idx_inimigos_user_id on public.inimigos (user_id);
