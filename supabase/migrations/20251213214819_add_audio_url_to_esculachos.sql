-- Adicionar coluna audio_url para guardar URL do Supabase Storage
ALTER TABLE esculachos ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN esculachos.audio_url IS 'URL pública do áudio no Supabase Storage';;
