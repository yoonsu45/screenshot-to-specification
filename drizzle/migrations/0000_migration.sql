CREATE TABLE public.event_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  event_id text NOT NULL,
  visit_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_saves_user_event_unique UNIQUE (user_id, event_id)
);

CREATE INDEX event_saves_event_id_idx ON public.event_saves (event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_saves TO authenticated;
GRANT ALL ON public.event_saves TO service_role;

ALTER TABLE public.event_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saves" ON public.event_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saves" ON public.event_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saves" ON public.event_saves
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saves" ON public.event_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Anonymous aggregate: per-event save counts, no user info exposed
CREATE OR REPLACE FUNCTION public.get_event_save_counts(p_event_ids text[] DEFAULT NULL)
RETURNS TABLE (event_id text, save_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.event_id, count(*)::bigint
  FROM public.event_saves s
  WHERE p_event_ids IS NULL OR s.event_id = ANY(p_event_ids)
  GROUP BY s.event_id;
$$;

REVOKE ALL ON FUNCTION public.get_event_save_counts(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_save_counts(text[]) TO anon, authenticated, service_role;