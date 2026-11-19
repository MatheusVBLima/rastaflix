-- Habilitar RLS
ALTER TABLE public.historias ENABLE ROW LEVEL SECURITY;

-- Políticas (seguindo padrão das outras tabelas)
CREATE POLICY "Allow public read access to historias"
  ON public.historias FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert historias"
  ON public.historias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update historias"
  ON public.historias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete historias"
  ON public.historias FOR DELETE
  TO authenticated
  USING (true);;
