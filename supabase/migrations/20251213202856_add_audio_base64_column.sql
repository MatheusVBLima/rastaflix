-- Adicionar coluna para armazenar áudio em base64 diretamente no banco
-- Renomear audio_url para audio_data (será base64)
ALTER TABLE esculachos DROP COLUMN IF EXISTS audio_url;
ALTER TABLE esculachos ADD COLUMN audio_data TEXT;;
