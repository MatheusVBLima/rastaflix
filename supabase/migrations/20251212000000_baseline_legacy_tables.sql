-- Baseline: tabelas criadas antes de o projeto usar migrations.
--
-- Recria o schema como ele estava antes de 20251212190746, para que
-- `supabase start` / `supabase db reset` monte o banco completo do zero.
-- Mudanças posteriores (RLS de historias/award_*, audio_url, archived,
-- lock_down_writes etc.) continuam nas migrations seguintes.
--
-- Em produção estas tabelas já existiam; a migration foi marcada como
-- aplicada lá (supabase_migrations.schema_migrations) sem ser executada.

-- Tipos -----------------------------------------------------------------------

create type public.inimigo_status as enum ('vingado', 'pendente');

-- Funções ---------------------------------------------------------------------

create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Histórias -------------------------------------------------------------------

create table public.historias (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tags text[],
  url text not null,
  image_url text,
  user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.historias is 'Armazena as histórias cadastradas na plataforma.';
comment on column public.historias.user_id is 'ID do usuário do Clerk associado a esta história.';

create trigger set_timestamp_historias
  before update on public.historias
  for each row execute function public.trigger_set_timestamp();

-- Músicas ---------------------------------------------------------------------

create table public.musicas (
  id uuid primary key default extensions.uuid_generate_v4(),
  title text not null,
  url text not null,
  image_url text,
  created_at timestamptz not null default now()
);

comment on table public.musicas is 'Tabela para armazenar informações sobre músicas';
comment on column public.musicas.id is 'Identificador único para cada música';
comment on column public.musicas.title is 'Título da música';
comment on column public.musicas.url is 'URL para acessar a música (YouTube, Spotify, etc.)';
comment on column public.musicas.image_url is 'URL para a imagem de capa da música (opcional)';
comment on column public.musicas.created_at is 'Data e hora de criação do registro';

create index idx_musicas_title on public.musicas (title);

alter table public.musicas enable row level security;
create policy musicas_select on public.musicas
  for select to anon, authenticated using (true);

-- Esculachos ------------------------------------------------------------------

create table public.esculachos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  conteudo text not null,
  autor text,
  created_at timestamptz not null default now()
);

comment on column public.esculachos.titulo is 'Título principal do esculacho.';
comment on column public.esculachos.descricao is 'Descrição breve ou subtítulo (opcional).';
comment on column public.esculachos.conteudo is 'O conteúdo em si do esculacho (pode ser um texto, link, etc.).';
comment on column public.esculachos.autor is 'Quem originou ou registrou o esculacho (opcional).';

alter table public.esculachos enable row level security;
create policy "Allow public read access to esculachos" on public.esculachos
  for select to anon, authenticated using (true);

-- Inimigos --------------------------------------------------------------------

create table public.inimigos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  nome text not null,
  status public.inimigo_status not null default 'pendente',
  user_id uuid references auth.users (id) on delete cascade
);

comment on table public.inimigos is 'Tabela para armazenar informações sobre inimigos e seu status de vingança.';
comment on column public.inimigos.nome is 'Nome do inimigo.';
comment on column public.inimigos.status is 'Status da vingança: vingado ou pendente.';
comment on column public.inimigos.user_id is 'ID do usuário que adicionou o inimigo (opcional, mas útil para RLS).';

create index idx_inimigos_nome on public.inimigos (nome);
create index idx_inimigos_status on public.inimigos (status);

alter table public.inimigos enable row level security;
create policy "Allow anonymous read access to inimigos" on public.inimigos
  for select to anon using (true);
create policy "Allow authenticated read access to inimigos" on public.inimigos
  for select to authenticated using (true);

-- Rasta Awards ----------------------------------------------------------------

create table public.award_seasons (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.award_categories (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.award_seasons (id) on delete cascade,
  name text not null,
  description text,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_season on public.award_categories (season_id);

create table public.award_nominees (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.award_categories (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  content_link text,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_nominees_category on public.award_nominees (category_id);

create table public.award_votes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  category_id uuid not null references public.award_categories (id) on delete cascade,
  nominee_id uuid not null references public.award_nominees (id) on delete cascade,
  season_id uuid not null references public.award_seasons (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint award_votes_user_category_unique unique (user_id, category_id)
);

create index idx_votes_category on public.award_votes (category_id);
create index idx_votes_nominee on public.award_votes (nominee_id);
create index idx_votes_season on public.award_votes (season_id);
create index idx_votes_user on public.award_votes (user_id);
