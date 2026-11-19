-- Criar bucket para áudios dos esculachos
INSERT INTO storage.buckets (id, name, public)
VALUES ('esculachos-audio', 'esculachos-audio', true);

-- Policy para leitura pública
CREATE POLICY "Public read access for esculachos audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'esculachos-audio');

-- Policy para upload (qualquer usuário autenticado pode fazer upload)
CREATE POLICY "Authenticated upload for esculachos audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'esculachos-audio');

-- Policy para update
CREATE POLICY "Authenticated update for esculachos audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'esculachos-audio');

-- Policy para delete
CREATE POLICY "Authenticated delete for esculachos audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'esculachos-audio');;
