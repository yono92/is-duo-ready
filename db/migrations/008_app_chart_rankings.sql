-- Separate official chart observations from support evidence and review dates.
CREATE TABLE public.app_chart_rankings (
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  country text NOT NULL DEFAULT 'KR' CHECK (country='KR'),
  chart_kind text NOT NULL CHECK (chart_kind IN ('top-free','top-paid')),
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 100),
  source_url text NOT NULL CHECK (
    source_url='https://rss.marketingtools.apple.com/api/v2/kr/apps/' || chart_kind || '/100/apps.json'),
  chart_updated_at timestamptz NOT NULL,
  observed_at timestamptz NOT NULL,
  PRIMARY KEY(country,chart_kind,app_id),
  UNIQUE(country,chart_kind,rank)
);
CREATE INDEX app_chart_rankings_app_idx ON public.app_chart_rankings(app_id);
ALTER TABLE public.app_chart_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_read ON public.app_chart_rankings FOR SELECT TO anon,authenticated
  USING (EXISTS (SELECT 1 FROM public.directory_entries e
    WHERE e.app_id=app_chart_rankings.app_id AND e.publication='published' AND e.country='KR'));
CREATE POLICY admin_access ON public.app_chart_rankings TO authenticated
  USING ((SELECT app_private.is_admin())) WITH CHECK ((SELECT app_private.is_admin()));
REVOKE ALL ON public.app_chart_rankings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.app_chart_rankings TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.app_chart_rankings TO authenticated;
