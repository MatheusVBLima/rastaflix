-- 1. Soft-archive support for video tables (historias, musicas, clipes) -------------
-- Archived videos stay in the admin table so admins can restore them if a removed
-- video comes back online, while remaining hidden from all public queries.

alter table public.historias
  add column if not exists archived boolean not null default false;

alter table public.musicas
  add column if not exists archived boolean not null default false;

alter table public.clipes
  add column if not exists archived boolean not null default false;

create index if not exists idx_historias_archived_created_at
  on public.historias (archived, created_at desc);

create index if not exists idx_musicas_archived_created_at
  on public.musicas (archived, created_at desc);

create index if not exists idx_clipes_archived_created_at
  on public.clipes (archived, created_at desc);

-- Archive the 5 historias whose YouTube videos are currently unavailable (403/404):
--   oes_QKIu84s, c84vAJ-SQ6Q, r7PYMeEkoJM, oDH1_YWlNOo, tROxgo2ZvEA
update public.historias
set archived = true
where id in (
  '3b19d150-eb39-4fd2-b82c-3d56b050299b',
  'b899766f-9acd-43c8-a71c-5b89aee18c75',
  '4e116190-df59-4a88-8f33-e3e04809b528',
  '9bccf41b-ae76-40f3-9570-29bc7883d8da',
  '173c8974-673a-44d2-9e9c-b83f28d6c654'
);

-- 2. Public image storage bucket (writes restricted to service_role via admin API) --
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-images',
  'media-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'award-nominees',
  'award-nominees',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read-only access for images; all uploads go through /api/admin/upload-image
-- using the service role after Clerk admin verification.
drop policy if exists "Public read for media-images" on storage.objects;
create policy "Public read for media-images" on storage.objects
  for select to public
  using (bucket_id = 'media-images');

drop policy if exists "Public read for award-nominees" on storage.objects;
create policy "Public read for award-nominees" on storage.objects
  for select to public
  using (bucket_id = 'award-nominees');
