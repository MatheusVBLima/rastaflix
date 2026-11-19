CREATE TABLE streamer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitch_username TEXT NOT NULL DEFAULT 'ovelhera',
  kick_username TEXT NOT NULL DEFAULT 'OvelheraM',
  twitch_user_id TEXT,
  is_live_twitch BOOLEAN DEFAULT false,
  is_live_kick BOOLEAN DEFAULT false,
  twitch_stream_title TEXT,
  kick_stream_title TEXT,
  twitch_viewer_count INTEGER,
  kick_viewer_count INTEGER,
  twitch_thumbnail_url TEXT,
  kick_thumbnail_url TEXT,
  last_twitch_update TIMESTAMPTZ,
  last_kick_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config row
INSERT INTO streamer_config (twitch_username, kick_username)
VALUES ('ovelhera', 'OvelheraM');

-- Enable RLS
ALTER TABLE streamer_config ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can read streamer status)
CREATE POLICY "Public read streamer_config" ON streamer_config
  FOR SELECT USING (true);;
