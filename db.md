-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.award_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT award_categories_pkey PRIMARY KEY (id),
  CONSTRAINT award_categories_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.award_seasons(id)
);
CREATE TABLE public.award_nominees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  content_link text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT award_nominees_pkey PRIMARY KEY (id),
  CONSTRAINT award_nominees_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id)
);
CREATE TABLE public.award_seasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT award_seasons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.award_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  category_id uuid NOT NULL,
  nominee_id uuid NOT NULL,
  season_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT award_votes_pkey PRIMARY KEY (id),
  CONSTRAINT award_votes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.award_categories(id),
  CONSTRAINT award_votes_nominee_id_fkey FOREIGN KEY (nominee_id) REFERENCES public.award_nominees(id),
  CONSTRAINT award_votes_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.award_seasons(id)
);
CREATE TABLE public.esculachos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  conteudo text NOT NULL,
  autor text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT esculachos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.historias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  tags ARRAY,
  url text NOT NULL,
  image_url text,
  user_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT historias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inimigos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  nome text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pendente'::inimigo_status,
  user_id uuid,
  CONSTRAINT inimigos_pkey PRIMARY KEY (id),
  CONSTRAINT inimigos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.musicas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  url text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT musicas_pkey PRIMARY KEY (id)
);