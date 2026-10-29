-- PostgreSQL 17. Standalone local roles are prepared by scripts/migrate.mjs.
-- Never expose app_private as a Supabase Data API schema.
CREATE SCHEMA app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE FUNCTION app_private.actor_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
$$;
REVOKE ALL ON FUNCTION app_private.actor_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.actor_id() TO authenticated;

CREATE TABLE app_private.admin_users (
  user_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app_private.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY self_read ON app_private.admin_users FOR SELECT TO authenticated
  USING (user_id = (SELECT app_private.actor_id()));
GRANT SELECT ON app_private.admin_users TO authenticated;

CREATE FUNCTION app_private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM app_private.admin_users
    WHERE user_id = app_private.actor_id() AND enabled)
$$;
REVOKE ALL ON FUNCTION app_private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_admin() TO authenticated;

CREATE FUNCTION app_private.valid_aliases(items text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cardinality(items) <= 50 AND NOT EXISTS
    (SELECT 1 FROM unnest(items) AS item WHERE item IS NULL OR length(btrim(item)) NOT BETWEEN 1 AND 100)
$$;
REVOKE ALL ON FUNCTION app_private.valid_aliases(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.valid_aliases(text[]) TO authenticated;

CREATE TABLE app_private.apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_store_id text NOT NULL UNIQUE CHECK (app_store_id ~ '^[1-9][0-9]{0,19}$'),
  slug text NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 150 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  developer text NOT NULL CHECK (length(btrim(developer)) BETWEEN 1 AND 200),
  category text CHECK (category IN ('productivity','graphics-design','music','books','travel',
    'navigation','photo-video','entertainment','lifestyle')),
  aliases text[] NOT NULL DEFAULT '{}' CHECK (app_private.valid_aliases(aliases)),
  original_locale text NOT NULL DEFAULT 'ko' CHECK (original_locale IN ('ko','en')),
  publication text NOT NULL DEFAULT 'draft' CHECK (publication IN ('draft','published','archived')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_private.app_translations (
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  locale text NOT NULL CHECK (locale IN ('ko','en')),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 4000),
  state text NOT NULL DEFAULT 'current' CHECK (state IN ('current','needs-review')),
  PRIMARY KEY (app_id, locale)
);

CREATE TABLE app_private.app_store_listings (
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  country text NOT NULL DEFAULT 'KR' CHECK (country = 'KR'),
  store_url text NOT NULL CHECK (length(store_url) <= 2000 AND store_url ~ '^https://apps[.]apple[.]com/kr/[^?#]*id[0-9]+$'),
  current_version text CHECK (length(btrim(current_version)) BETWEEN 1 AND 100),
  release_notes text CHECK (length(release_notes) <= 20000),
  icon_url text CHECK (length(icon_url) <= 2000 AND icon_url ~ '^https://'),
  last_fetch_success_at timestamptz,
  PRIMARY KEY (app_id, country)
);

CREATE TABLE app_private.app_support (
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  country text NOT NULL DEFAULT 'KR' CHECK (country = 'KR'),
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('supported','planned','unknown','unsupported')),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 4000),
  support_version text CHECK (length(btrim(support_version)) BETWEEN 1 AND 100),
  investigation_reason text NOT NULL DEFAULT '' CHECK (length(investigation_reason) <= 4000),
  reviewed_at timestamptz,
  PRIMARY KEY (app_id, country)
);

CREATE TABLE app_private.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL UNIQUE CHECK (length(url) <= 2000 AND url ~ '^https://[A-Za-z0-9][A-Za-z0-9.-]+[A-Za-z]/' AND url !~ '[@#[:space:]]'),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 500),
  kind text NOT NULL CHECK (kind IN ('app_store','developer','apple')),
  official_confirmed boolean NOT NULL DEFAULT false
);

CREATE TABLE app_private.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES app_private.sources(id),
  quote text NOT NULL CHECK (length(btrim(quote)) BETWEEN 1 AND 4000),
  announced_at date,
  support_version text CHECK (length(btrim(support_version)) BETWEEN 1 AND 100),
  country text NOT NULL DEFAULT 'KR' CHECK (country = 'KR'),
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  UNIQUE (source_id, fingerprint)
);

CREATE FUNCTION app_private.evidence_fingerprint() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.fingerprint := encode(sha256(convert_to(jsonb_build_array(
    NEW.quote, NEW.support_version, NEW.country,
    CASE WHEN NEW.announced_at IS NULL THEN NULL ELSE to_char(NEW.announced_at, 'YYYY-MM-DD') END
  )::text, 'UTF8')), 'hex');
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION app_private.evidence_fingerprint() FROM PUBLIC;
CREATE TRIGGER fingerprint BEFORE INSERT OR UPDATE ON app_private.evidence
  FOR EACH ROW EXECUTE FUNCTION app_private.evidence_fingerprint();

CREATE TABLE app_private.app_evidence (
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  evidence_id uuid NOT NULL REFERENCES app_private.evidence(id),
  PRIMARY KEY (app_id, evidence_id)
);
CREATE INDEX app_evidence_evidence_idx ON app_private.app_evidence(evidence_id);

CREATE TABLE app_private.support_features (
  app_id uuid NOT NULL,
  feature_key text NOT NULL CHECK (feature_key ~ '^[a-z][a-z0-9-]{0,49}$'),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 1000),
  evidence_id uuid NOT NULL,
  PRIMARY KEY (app_id, feature_key),
  FOREIGN KEY (app_id, evidence_id) REFERENCES app_private.app_evidence(app_id, evidence_id)
);
CREATE INDEX features_evidence_idx ON app_private.support_features(app_id, evidence_id);

CREATE TABLE app_private.slug_redirects (
  old_slug text PRIMARY KEY CHECK (length(old_slug) BETWEEN 1 AND 150 AND old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  app_id uuid NOT NULL REFERENCES app_private.apps(id)
);
CREATE INDEX redirects_app_idx ON app_private.slug_redirects(app_id);

CREATE TABLE app_private.review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  actor uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('publish','correct','archive')),
  internal_note text NOT NULL DEFAULT '' CHECK (length(internal_note) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_events_app_idx ON app_private.review_events(app_id);

CREATE TABLE public.directory_entries (
  app_id uuid PRIMARY KEY REFERENCES app_private.apps(id),
  slug text NOT NULL UNIQUE,
  publication text NOT NULL CHECK (publication IN ('published','archived')),
  country text NOT NULL DEFAULT 'KR' CHECK (country = 'KR'),
  reviewed_at timestamptz NOT NULL,
  support_changed_at timestamptz NOT NULL,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object')
);

CREATE TABLE public.support_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.directory_entries(app_id),
  before_snapshot jsonb,
  after_snapshot jsonb NOT NULL CHECK (jsonb_typeof(after_snapshot) = 'object'),
  change_reason text NOT NULL CHECK (length(btrim(change_reason)) BETWEEN 1 AND 4000),
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX history_app_time_idx ON public.support_history(app_id, changed_at DESC, id);
CREATE INDEX history_time_idx ON public.support_history(changed_at DESC, id);

-- Admin lookup reads only the caller's allow-list row; no SECURITY DEFINER
-- helper or recursive admin_users policy is needed.
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['apps','app_translations','app_store_listings','app_support',
    'sources','evidence','app_evidence','support_features','slug_redirects'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY admin_access ON app_private.%I TO authenticated USING ((SELECT app_private.is_admin())) WITH CHECK ((SELECT app_private.is_admin()))', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON app_private.%I TO authenticated', tbl);
  END LOOP;
END
$$;

ALTER TABLE app_private.review_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_audit ON app_private.review_events TO authenticated
  USING ((SELECT app_private.is_admin()))
  WITH CHECK ((SELECT app_private.is_admin()) AND actor = (SELECT app_private.actor_id()));
GRANT SELECT, INSERT ON app_private.review_events TO authenticated;

ALTER TABLE public.directory_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_read ON public.directory_entries FOR SELECT TO anon, authenticated
  USING (publication = 'published');
CREATE POLICY admin_access ON public.directory_entries TO authenticated
  USING ((SELECT app_private.is_admin())) WITH CHECK ((SELECT app_private.is_admin()));
GRANT SELECT ON public.directory_entries TO anon;
GRANT SELECT, INSERT, UPDATE ON public.directory_entries TO authenticated;

ALTER TABLE public.support_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_read ON public.support_history FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.directory_entries e WHERE e.app_id = support_history.app_id AND e.publication = 'published'));
CREATE POLICY admin_read ON public.support_history FOR SELECT TO authenticated
  USING ((SELECT app_private.is_admin()));
CREATE POLICY admin_insert ON public.support_history FOR INSERT TO authenticated
  WITH CHECK ((SELECT app_private.is_admin()));
GRANT SELECT ON public.support_history TO anon;
GRANT SELECT, INSERT ON public.support_history TO authenticated;

-- Hosted Supabase may have pre-existing default grants. Restrict explicitly.
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA app_private FROM authenticated;
REVOKE ALL ON public.directory_entries, public.support_history FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.directory_entries FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.support_history FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.directory_entries FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.support_history FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON app_private.admin_users FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON app_private.review_events FROM authenticated;
