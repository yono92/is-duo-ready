-- Operational data is never added to the Supabase exposed-schema list.
CREATE TABLE app_private.collection_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES app_private.apps(id),
  kind text NOT NULL CHECK(kind IN ('app_store','web')),
  url text NOT NULL CHECK(length(url)<=2000 AND url ~ '^https://[a-z0-9.-]+/' AND url !~ '[@#[:space:]]'),
  approved_host text NOT NULL CHECK(approved_host ~ '^[a-z0-9][a-z0-9.-]+[a-z]$'),
  approval_note text NOT NULL CHECK(length(btrim(approval_note)) BETWEEN 1 AND 1000),
  enabled boolean NOT NULL DEFAULT true,
  interval_hours integer NOT NULL DEFAULT 24 CHECK(interval_hours BETWEEN 24 AND 168),
  next_due_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  last_success_at timestamptz,
  failures integer NOT NULL DEFAULT 0 CHECK(failures>=0),
  last_error text CHECK(length(last_error)<=50),
  UNIQUE(app_id,url)
);
CREATE TABLE app_private.collection_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES app_private.collection_targets(id),
  token uuid NOT NULL,
  state text NOT NULL DEFAULT 'running' CHECK(state IN ('running','succeeded','failed','abandoned')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
  error_code text CHECK(length(error_code)<=50),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX collection_runs_target ON app_private.collection_runs(target_id,started_at DESC);
CREATE TABLE app_private.collection_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES app_private.collection_targets(id),
  fingerprint text NOT NULL CHECK(fingerprint ~ '^[a-f0-9]{64}$'),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object' AND octet_length(payload::text)<=150000),
  observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(target_id,fingerprint)
);
ALTER TABLE app_private.collection_targets ADD COLUMN last_observation_id uuid REFERENCES app_private.collection_observations(id);
CREATE TABLE app_private.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK(kind IN ('add','correction')),
  app_store_id text NOT NULL CHECK(app_store_id ~ '^[1-9][0-9]{0,19}$'),
  store_url text NOT NULL CHECK(length(store_url)<=2000 AND store_url ~ '^https://apps[.]apple[.]com/kr/app/id[1-9][0-9]{0,19}$'),
  body text NOT NULL CHECK(length(btrim(body)) BETWEEN 10 AND 4000),
  evidence_url text NOT NULL CHECK(length(evidence_url)<=2000 AND evidence_url ~ '^https://[a-zA-Z0-9.-]+/' AND evidence_url !~ '[@#[:space:]]'),
  fingerprint text NOT NULL UNIQUE CHECK(fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid REFERENCES app_private.apps(id),
  target_id uuid REFERENCES app_private.collection_targets(id),
  observation_id uuid UNIQUE REFERENCES app_private.collection_observations(id),
  submission_id uuid UNIQUE REFERENCES app_private.submissions(id),
  before_payload jsonb,
  candidate_payload jsonb NOT NULL CHECK(jsonb_typeof(candidate_payload)='object' AND octet_length(candidate_payload::text)<=150000),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','deferred','approved','rejected')),
  revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
  reason text NOT NULL DEFAULT '' CHECK(length(reason)<=4000),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK((observation_id IS NOT NULL AND target_id IS NOT NULL AND submission_id IS NULL) OR
    (submission_id IS NOT NULL AND observation_id IS NULL AND target_id IS NULL))
);
CREATE INDEX review_items_queue ON app_private.review_items(state,created_at DESC,id);
CREATE TABLE app_private.review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES app_private.review_items(id),
  actor uuid NOT NULL,
  action text NOT NULL CHECK(action IN ('approved','deferred','rejected','linked')),
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.submission_limits (
  bucket text NOT NULL,
  hour timestamptz NOT NULL,
  requests integer NOT NULL CHECK(requests>0),
  PRIMARY KEY(bucket,hour)
);
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['collection_targets','collection_runs','collection_observations','submissions','review_items','review_decisions'] LOOP
    EXECUTE format('ALTER TABLE app_private.%I ENABLE ROW LEVEL SECURITY',tbl);
    EXECUTE format('REVOKE ALL ON app_private.%I FROM PUBLIC,anon,authenticated',tbl);
    EXECUTE format('CREATE POLICY admin_access ON app_private.%I TO authenticated USING ((SELECT app_private.is_admin())) WITH CHECK ((SELECT app_private.is_admin()))',tbl);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE ON app_private.%I TO authenticated',tbl);
  END LOOP;
END $$;
REVOKE INSERT,UPDATE ON app_private.submissions FROM authenticated;
REVOKE UPDATE ON app_private.collection_observations,app_private.review_decisions FROM authenticated;
ALTER TABLE app_private.submission_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.submission_limits FROM PUBLIC,anon,authenticated;

CREATE FUNCTION app_private.claim_collection(target_value uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE target app_private.collection_targets; token_value uuid:=gen_random_uuid(); rid uuid;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF NOT pg_try_advisory_xact_lock(409,5) THEN RETURN NULL; END IF;
  -- Expire a crashed worker before claiming another; stale finish requests cannot commit.
  UPDATE app_private.collection_runs r SET state='abandoned',error_code='interrupted',finished_at=clock_timestamp()
    FROM app_private.collection_targets t WHERE r.target_id=t.id AND r.token=t.lease_token
      AND r.state='running' AND t.lease_expires_at<clock_timestamp();
  UPDATE app_private.collection_targets SET lease_token=NULL,lease_expires_at=NULL,failures=failures+1,last_error='interrupted'
    WHERE lease_expires_at<clock_timestamp();
  IF EXISTS(SELECT 1 FROM app_private.collection_targets WHERE lease_token IS NOT NULL) THEN RETURN NULL; END IF;
  SELECT * INTO target FROM app_private.collection_targets WHERE enabled AND lease_token IS NULL
    AND ((target_value IS NULL AND next_due_at<=clock_timestamp()) OR id=target_value)
    ORDER BY next_due_at,id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE app_private.collection_targets SET lease_token=token_value,lease_expires_at=clock_timestamp()+interval '5 minutes'
    WHERE id=target.id;
  INSERT INTO app_private.collection_runs(target_id,token) VALUES(target.id,token_value) RETURNING id INTO rid;
  RETURN to_jsonb(target)||jsonb_build_object('run_id',rid,'token',token_value,
    'app_store_id',(SELECT app_store_id FROM app_private.apps WHERE id=target.app_id));
END $$;
REVOKE ALL ON FUNCTION app_private.claim_collection(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.claim_collection(uuid) TO authenticated;

CREATE FUNCTION app_private.finish_collection(run_value uuid, token_value uuid, payload_value jsonb, error_value text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE run app_private.collection_runs; target app_private.collection_targets; oid uuid; old jsonb; hash_value text;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO run FROM app_private.collection_runs WHERE id=run_value FOR UPDATE;
  SELECT * INTO target FROM app_private.collection_targets WHERE id=run.target_id FOR UPDATE;
  IF run.state IS DISTINCT FROM 'running' OR target.lease_token IS DISTINCT FROM token_value OR run.token IS DISTINCT FROM token_value
    OR target.lease_expires_at<clock_timestamp() THEN RAISE EXCEPTION 'Stale worker' USING ERRCODE='40001'; END IF;
  IF error_value IS NULL THEN
    IF payload_value IS NULL OR jsonb_typeof(payload_value)<>'object' THEN RAISE EXCEPTION 'Invalid result' USING ERRCODE='23514'; END IF;
    SELECT payload INTO old FROM app_private.collection_observations WHERE id=target.last_observation_id;
    hash_value:=encode(sha256(convert_to(payload_value::text,'UTF8')),'hex');
    INSERT INTO app_private.collection_observations(target_id,fingerprint,payload) VALUES(target.id,hash_value,payload_value)
      ON CONFLICT(target_id,fingerprint) DO NOTHING RETURNING id INTO oid;
    IF oid IS NOT NULL THEN
      INSERT INTO app_private.review_items(app_id,target_id,observation_id,before_payload,candidate_payload)
        VALUES(target.app_id,target.id,oid,old,payload_value);
    END IF;
    UPDATE app_private.collection_targets SET last_success_at=clock_timestamp(),failures=0,last_error=NULL,
      last_observation_id=(SELECT id FROM app_private.collection_observations WHERE target_id=target.id AND fingerprint=hash_value) WHERE id=target.id;
  ELSE
    UPDATE app_private.collection_targets SET failures=failures+1,last_error=error_value WHERE id=target.id;
  END IF;
  UPDATE app_private.collection_targets SET lease_token=NULL,lease_expires_at=NULL,
    next_due_at=clock_timestamp()+make_interval(hours=>interval_hours) WHERE id=target.id;
  UPDATE app_private.collection_runs SET state=CASE WHEN error_value IS NULL THEN 'succeeded' ELSE 'failed' END,
    error_code=error_value,finished_at=clock_timestamp() WHERE id=run.id;
END $$;
REVOKE ALL ON FUNCTION app_private.finish_collection(uuid,uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.finish_collection(uuid,uuid,jsonb,text) TO authenticated;

CREATE FUNCTION app_private.decide_review(review_value uuid, expected_revision integer, decision text, reason_value text, app_revision integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item app_private.review_items;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF decision IS NULL OR decision NOT IN ('approved','deferred','rejected') OR reason_value IS NULL OR length(btrim(reason_value)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE='23514'; END IF;
  SELECT * INTO item FROM app_private.review_items WHERE id=review_value FOR UPDATE;
  IF NOT FOUND OR item.revision IS DISTINCT FROM expected_revision OR item.state NOT IN ('pending','deferred') THEN
    RAISE EXCEPTION 'Review conflict' USING ERRCODE='40001'; END IF;
  IF decision='approved' THEN
    IF item.app_id IS NULL THEN RAISE EXCEPTION 'Link app first' USING ERRCODE='23514'; END IF;
    PERFORM app_private.publish_app(item.app_id,app_revision,reason_value,'');
  END IF;
  INSERT INTO app_private.review_decisions(review_id,actor,action,reason) VALUES(item.id,app_private.actor_id(),decision,reason_value);
  UPDATE app_private.review_items SET state=decision,revision=revision+1,reason=reason_value,
    decided_by=app_private.actor_id(),decided_at=clock_timestamp() WHERE id=item.id;
END $$;
REVOKE ALL ON FUNCTION app_private.decide_review(uuid,integer,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.decide_review(uuid,integer,text,text,integer) TO authenticated;

CREATE FUNCTION app_private.link_submission(review_value uuid, expected_revision integer, app_value uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item app_private.review_items;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO item FROM app_private.review_items WHERE id=review_value FOR UPDATE;
  IF NOT FOUND OR item.revision IS DISTINCT FROM expected_revision OR item.state NOT IN ('pending','deferred') THEN
    RAISE EXCEPTION 'Review conflict' USING ERRCODE='40001'; END IF;
  IF item.submission_id IS NULL OR NOT EXISTS(SELECT 1 FROM app_private.apps a JOIN app_private.submissions s
    ON a.app_store_id=s.app_store_id WHERE a.id=app_value AND s.id=item.submission_id) THEN
    RAISE EXCEPTION 'App mismatch' USING ERRCODE='23514'; END IF;
  UPDATE app_private.review_items SET app_id=app_value,revision=revision+1 WHERE id=item.id;
  INSERT INTO app_private.review_decisions(review_id,actor,action,reason) VALUES(item.id,app_private.actor_id(),'linked','Matched App Store ID');
END $$;
REVOKE ALL ON FUNCTION app_private.link_submission(uuid,integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.link_submission(uuid,integer,uuid) TO authenticated;

-- Do not expose submission_ingress in Supabase's Data API schemas.
CREATE SCHEMA submission_ingress;
REVOKE ALL ON SCHEMA submission_ingress FROM PUBLIC;
GRANT USAGE ON SCHEMA submission_ingress TO anon,authenticated;
CREATE FUNCTION submission_ingress.accept(input jsonb, visitor_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE hour_value timestamptz:=date_trunc('hour',clock_timestamp()); n integer; sid uuid; aid uuid; hash_value text;
BEGIN
  IF input IS NULL OR jsonb_typeof(input)<>'object' OR octet_length(input::text)>20000
    OR visitor_hash IS NULL OR visitor_hash !~ '^[a-f0-9]{64}$'
    OR EXISTS(SELECT 1 FROM unnest(ARRAY['kind','app_store_id','store_url','body','evidence_url']) k WHERE jsonb_typeof(input->k) IS DISTINCT FROM 'string')
    OR coalesce(input->>'kind','') NOT IN ('add','correction')
    OR coalesce(input->>'app_store_id','') !~ '^[1-9][0-9]{0,19}$'
    OR input->>'store_url' IS DISTINCT FROM 'https://apps.apple.com/kr/app/id'||(input->>'app_store_id')
    OR length(btrim(coalesce(input->>'body',''))) NOT BETWEEN 10 AND 4000
    OR length(coalesce(input->>'evidence_url','')) NOT BETWEEN 1 AND 2000
    OR coalesce(input->>'evidence_url','') !~ '^https://[a-zA-Z0-9.-]+/'
    OR input->>'evidence_url' ~ '[@#[:space:]]'
    THEN RAISE EXCEPTION 'Invalid submission' USING ERRCODE='23514'; END IF;
  -- A single short transaction serializes both limits; rotating visitor tokens never bypasses the site cap.
  PERFORM pg_advisory_xact_lock(409,6);
  DELETE FROM app_private.submission_limits WHERE hour<hour_value-interval '1 day';
  SELECT requests INTO n FROM app_private.submission_limits WHERE bucket='global' AND hour=hour_value;
  IF coalesce(n,0)>=60 THEN RAISE EXCEPTION 'Try later' USING ERRCODE='P0429'; END IF;
  SELECT requests INTO n FROM app_private.submission_limits WHERE bucket=visitor_hash AND hour=hour_value;
  IF coalesce(n,0)>=5 THEN RAISE EXCEPTION 'Try later' USING ERRCODE='P0429'; END IF;
  INSERT INTO app_private.submission_limits(bucket,hour,requests) VALUES('global',hour_value,1),(visitor_hash,hour_value,1)
    ON CONFLICT(bucket,hour) DO UPDATE SET requests=app_private.submission_limits.requests+1;
  hash_value:=encode(sha256(convert_to(jsonb_build_array(input->>'kind',input->>'app_store_id',btrim(input->>'body'),input->>'evidence_url')::text,'UTF8')),'hex');
  INSERT INTO app_private.submissions(kind,app_store_id,store_url,body,evidence_url,fingerprint)
    VALUES(input->>'kind',input->>'app_store_id',input->>'store_url',btrim(input->>'body'),input->>'evidence_url',hash_value)
    ON CONFLICT(fingerprint) DO NOTHING RETURNING id INTO sid;
  IF sid IS NOT NULL THEN
    SELECT id INTO aid FROM app_private.apps WHERE app_store_id=input->>'app_store_id';
    INSERT INTO app_private.review_items(app_id,submission_id,candidate_payload)
      VALUES(aid,sid,jsonb_build_object('kind',input->>'kind','app_store_id',input->>'app_store_id',
        'source_url',input->>'evidence_url','store_url',input->>'store_url','text',btrim(input->>'body')));
  END IF;
END $$;
REVOKE ALL ON FUNCTION submission_ingress.accept(jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submission_ingress.accept(jsonb,text) TO anon,authenticated;
