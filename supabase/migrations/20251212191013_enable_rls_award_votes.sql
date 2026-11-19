ALTER TABLE public.award_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to award_votes"
  ON public.award_votes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert award_votes"
  ON public.award_votes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update award_votes"
  ON public.award_votes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete award_votes"
  ON public.award_votes FOR DELETE
  TO authenticated
  USING (true);;
