CREATE TABLE clipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  plataforma TEXT NOT NULL CHECK (plataforma IN ('twitch', 'kick', 'youtube')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clipes ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view clips)
CREATE POLICY "Public read clipes" ON clipes
  FOR SELECT USING (true);;
