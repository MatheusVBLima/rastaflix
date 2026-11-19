-- Remover coluna audio_data que não será mais usada (substituída por audio_url)
ALTER TABLE esculachos DROP COLUMN IF EXISTS audio_data;;
