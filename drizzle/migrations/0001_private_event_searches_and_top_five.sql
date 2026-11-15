CREATE TABLE public.event_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  anonymous_session_id uuid NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_searches_session_event_unique UNIQUE (anonymous_session_id, event_id),
  CONSTRAINT event_searches_event_id_valid CHECK (length(btrim(event_id)) BETWEEN 1 AND 200 AND event_id = btrim(event_id))
);
GRANT ALL ON public.event_searches TO service_role;
REVOKE ALL ON public.event_searches FROM PUBLIC, anon, authenticated;
ALTER TABLE public.event_searches ENABLE ROW LEVEL SECURITY;
CREATE INDEX event_searches_recent_idx ON public.event_searches (searched_at DESC, event_id);

CREATE OR REPLACE FUNCTION public.record_event_search(p_event_id text, p_anonymous_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_event_id IS NULL OR length(btrim(p_event_id)) NOT BETWEEN 1 AND 200 OR p_anonymous_session_id IS NULL THEN
    RAISE EXCEPTION 'A valid event ID and anonymous session ID are required' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.event_searches (event_id, anonymous_session_id)
  VALUES (btrim(p_event_id), p_anonymous_session_id)
  ON CONFLICT (anonymous_session_id, event_id) DO NOTHING;
END;
$function$;
REVOKE ALL ON FUNCTION public.record_event_search(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event_search(text, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_top_event_searches()
RETURNS TABLE(event_id text, search_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT s.event_id, count(*) AS search_count
  FROM public.event_searches AS s
  WHERE s.searched_at >= now() - interval '7 days'
    AND s.searched_at <= now()
  GROUP BY s.event_id
  ORDER BY search_count DESC, s.event_id ASC
  LIMIT 5;
$function$;
REVOKE ALL ON FUNCTION public.get_top_event_searches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_event_searches() TO anon, authenticated, service_role;
COMMENT ON TABLE public.event_searches IS 'Private search analytics. One first search per event per anonymous session; no direct API access.';