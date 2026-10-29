CREATE TABLE app_private.import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid NOT NULL,
  input_fingerprint text NOT NULL CHECK (input_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.import_rows (
  run_id uuid NOT NULL REFERENCES app_private.import_runs(id),
  row_number integer NOT NULL CHECK (row_number BETWEEN 1 AND 200),
  input_url text NOT NULL CHECK (length(input_url) <= 2000),
  app_store_id text CHECK (app_store_id ~ '^[1-9][0-9]{0,19}$'),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','created','updated','duplicate','error')),
  app_id uuid REFERENCES app_private.apps(id),
  error_code text CHECK (length(error_code) <= 50),
  retryable boolean NOT NULL DEFAULT false,
  proposal jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(proposal) = 'object' AND octet_length(proposal::text) <= 30000),
  completed_at timestamptz,
  PRIMARY KEY (run_id,row_number)
);
CREATE INDEX import_rows_app_idx ON app_private.import_rows(app_id);
CREATE TABLE app_private.import_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  proposal jsonb NOT NULL CHECK (jsonb_typeof(proposal) = 'object' AND octet_length(proposal::text) <= 30000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id,fingerprint)
);
CREATE TABLE app_private.import_clock (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  last_attempt_at timestamptz
);
INSERT INTO app_private.import_clock(singleton) VALUES(true);
ALTER TABLE app_private.app_store_listings ADD COLUMN observed_metadata jsonb
  CHECK (jsonb_typeof(observed_metadata) = 'object' AND octet_length(observed_metadata::text) <= 150000);

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['import_runs','import_rows','import_proposals','import_clock'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',tbl);
    EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,anon,authenticated',tbl);
    EXECUTE format('CREATE POLICY admin_access ON app_private.%I TO authenticated USING ((SELECT app_private.is_admin())) WITH CHECK ((SELECT app_private.is_admin()))',tbl);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE ON app_private.%I TO authenticated',tbl);
  END LOOP;
END
$$;
CREATE POLICY actor_insert ON app_private.import_runs AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (actor = (SELECT app_private.actor_id()));

-- Only observed working metadata and private proposals are writable here.
-- Publication, support, evidence, review dates and public snapshots are untouched.
CREATE FUNCTION app_private.import_app(metadata jsonb, proposal jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE aid uuid; old_metadata jsonb; created boolean := false; changed boolean := false;
  added integer; slug_value text; item jsonb; fingerprint_value text;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(metadata) IS DISTINCT FROM 'object' OR jsonb_typeof(proposal) IS DISTINCT FROM 'object'
    OR octet_length(metadata::text) > 150000 OR octet_length(proposal::text) > 30000
    OR metadata->>'app_store_id' IS NULL OR metadata->>'fetched_at' IS NULL
    THEN RAISE EXCEPTION 'Invalid import' USING ERRCODE='23514'; END IF;
  -- Serialize same ID even if another import entry point is added later.
  PERFORM pg_advisory_xact_lock(hashtextextended(metadata->>'app_store_id', 409));
  SELECT id INTO aid FROM app_private.apps WHERE app_store_id=metadata->>'app_store_id' FOR UPDATE;
  IF aid IS NULL THEN
    aid := gen_random_uuid();
    slug_value := 'app-' || (metadata->>'app_store_id');
    IF EXISTS(SELECT 1 FROM app_private.apps WHERE slug=slug_value)
      OR EXISTS(SELECT 1 FROM app_private.slug_redirects WHERE old_slug=slug_value) THEN
      slug_value := slug_value || '-' || replace(aid::text,'-','');
    END IF;
    INSERT INTO app_private.apps(id,app_store_id,slug,name,developer,category)
      VALUES(aid,metadata->>'app_store_id',slug_value,metadata->>'name',metadata->>'developer',metadata->>'category');
    created := true;
  END IF;
  SELECT observed_metadata INTO old_metadata FROM app_private.app_store_listings WHERE app_id=aid AND country='KR';
  item := metadata - 'fetched_at';
  changed := old_metadata IS DISTINCT FROM item;
  INSERT INTO app_private.app_store_listings(app_id,country,store_url,current_version,release_notes,icon_url,last_fetch_success_at,observed_metadata)
    VALUES(aid,'KR','https://apps.apple.com/kr/app/id' || (metadata->>'app_store_id'),metadata->>'current_version',metadata->>'release_notes',
      metadata->>'icon_url',(metadata->>'fetched_at')::timestamptz,item)
    ON CONFLICT(app_id,country) DO UPDATE SET store_url=excluded.store_url,current_version=excluded.current_version,
      release_notes=excluded.release_notes,icon_url=excluded.icon_url,last_fetch_success_at=excluded.last_fetch_success_at,
      observed_metadata=excluded.observed_metadata;
  IF EXISTS(SELECT 1 FROM jsonb_each_text(proposal) WHERE value IS NOT NULL AND value <> '') THEN
    fingerprint_value := encode(sha256(convert_to(proposal::text,'UTF8')),'hex');
    INSERT INTO app_private.import_proposals(app_id,fingerprint,proposal) VALUES(aid,fingerprint_value,proposal)
      ON CONFLICT(app_id,fingerprint) DO NOTHING;
    GET DIAGNOSTICS added = ROW_COUNT;
    changed := changed OR added > 0;
  END IF;
  IF NOT created AND changed THEN
    UPDATE app_private.apps SET revision=revision+1,updated_at=clock_timestamp() WHERE id=aid;
  END IF;
  RETURN jsonb_build_object('id',aid,'state',CASE WHEN created THEN 'created' WHEN changed THEN 'updated' ELSE 'duplicate' END);
END
$$;
REVOKE ALL ON FUNCTION app_private.import_app(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.import_app(jsonb,jsonb) TO authenticated;
