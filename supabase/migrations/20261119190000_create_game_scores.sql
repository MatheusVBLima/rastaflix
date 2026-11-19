-- Tabela de pontuações / ranking para os jogos do Rastaflix
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_avatar TEXT,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100000000),
  kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0 AND kills <= 1000000),
  level_reached INTEGER NOT NULL DEFAULT 1 CHECK (level_reached >= 1 AND level_reached <= 500),
  survival_seconds INTEGER NOT NULL DEFAULT 0 CHECK (survival_seconds >= 0 AND survival_seconds <= 86400),
  bosses_defeated INTEGER NOT NULL DEFAULT 0 CHECK (bosses_defeated >= 0 AND bosses_defeated <= 1000),
  weapons_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  seed INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para leaderboard global e recorde pessoal
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard
  ON public.game_scores (game_slug, score DESC, survival_seconds DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_best
  ON public.game_scores (game_slug, user_id, score DESC);

-- RLS: leitura pública, escrita exclusivamente via service_role (Server Actions autenticadas)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view game scores" ON public.game_scores;
CREATE POLICY "Public can view game scores"
  ON public.game_scores
  FOR SELECT
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.game_scores FROM anon, authenticated;

COMMENT ON TABLE public.game_scores IS 'Leaderboard de pontuações dos jogos do Rastaflix';
