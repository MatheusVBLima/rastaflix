ALTER TABLE public.award_nominees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to award_nominees"
  ON public.award_nominees FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert award_nominees"
  ON public.award_nominees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update award_nominees"
  ON public.award_nominees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete award_nominees"
  ON public.award_nominees FOR DELETE
  TO authenticated
  USING (true);;
