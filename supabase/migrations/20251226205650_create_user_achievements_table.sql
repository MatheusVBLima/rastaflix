-- Create user_achievements table to track user badges and accomplishments
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('rasta_awards_voter', 'other')),
  achievement_year INTEGER NOT NULL,
  achievement_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique constraint to prevent duplicate achievements
  UNIQUE (user_id, achievement_type, achievement_year)
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Create index for achievement type queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON public.user_achievements(achievement_type);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (true);

-- Policy: Only the system (via service role) can insert achievements
CREATE POLICY "System can insert achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update achievements
CREATE POLICY "System can update achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (true);

-- Add comment to table
COMMENT ON TABLE public.user_achievements IS 'Tracks user achievements and badges earned through platform activities';
COMMENT ON COLUMN public.user_achievements.user_id IS 'Clerk user ID';
COMMENT ON COLUMN public.user_achievements.achievement_type IS 'Type of achievement (e.g., rasta_awards_voter)';
COMMENT ON COLUMN public.user_achievements.achievement_year IS 'Year the achievement was earned';
COMMENT ON COLUMN public.user_achievements.achievement_data IS 'Additional data about the achievement (JSON)';;
