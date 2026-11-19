ALTER TABLE public.award_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to award_categories"
  ON public.award_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert award_categories"
  ON public.award_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update award_categories"
  ON public.award_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete award_categories"
  ON public.award_categories FOR DELETE
  TO authenticated
  USING (true);;
