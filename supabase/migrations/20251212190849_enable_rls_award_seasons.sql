ALTER TABLE public.award_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to award_seasons"
  ON public.award_seasons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert award_seasons"
  ON public.award_seasons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update award_seasons"
  ON public.award_seasons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete award_seasons"
  ON public.award_seasons FOR DELETE
  TO authenticated
  USING (true);;
