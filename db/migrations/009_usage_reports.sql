-- Generated with Supabase CLI migration new; numbered for the repository's existing runner.
-- Community observations never change official support, evidence, or review timestamps.
CREATE FUNCTION app_private.valid_usage_details(value jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF value IS NULL OR jsonb_typeof(value)<>'object' OR octet_length(value::text)>2000
    OR EXISTS(SELECT 1 FROM unnest(ARRAY['device_model','environment','os_version','app_version','display_mode','result','observed_on']) k
      WHERE jsonb_typeof(value->k) IS DISTINCT FROM 'string')
    OR length(btrim(value->>'device_model')) NOT BETWEEN 1 AND 80
    OR length(btrim(value->>'os_version')) NOT BETWEEN 1 AND 80
    OR length(btrim(value->>'app_version')) NOT BETWEEN 1 AND 80
    OR value->>'environment' NOT IN ('device','simulator')
    OR value->>'display_mode' NOT IN ('unfolded','folded','transition')
    OR value->>'result' NOT IN ('works','issues')
    OR value->>'observed_on' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    THEN RETURN false; END IF;
  RETURN to_char((value->>'observed_on')::date,'YYYY-MM-DD')=value->>'observed_on';
EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION app_private.valid_usage_details(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.valid_usage_details(jsonb) TO authenticated;

ALTER TABLE app_private.submissions DROP CONSTRAINT submissions_kind_check;
ALTER TABLE app_private.submissions ADD CONSTRAINT submissions_kind_check CHECK(kind IN ('add','correction','usage'));
ALTER TABLE app_private.submissions ALTER COLUMN evidence_url DROP NOT NULL;
ALTER TABLE app_private.submissions ADD COLUMN usage jsonb;
ALTER TABLE app_private.submissions ADD COLUMN locale text;
ALTER TABLE app_private.submissions ADD COLUMN publish_consent boolean NOT NULL DEFAULT false;
ALTER TABLE app_private.submissions ADD CONSTRAINT submissions_usage_check CHECK(
  (kind='usage' AND app_private.valid_usage_details(usage) AND locale IN ('ko','en') AND locale IS NOT NULL AND publish_consent)
  OR (kind<>'usage' AND usage IS NULL AND locale IS NULL AND NOT publish_consent AND evidence_url IS NOT NULL)
);

CREATE TABLE app_private.submission_screenshots (
  submission_id uuid PRIMARY KEY REFERENCES app_private.submissions(id),
  bytes bytea NOT NULL CHECK(octet_length(bytes) BETWEEN 16 AND 1048576
    AND substring(bytes from 1 for 4)=decode('52494646','hex')
    AND substring(bytes from 9 for 4)=decode('57454250','hex'))
);
ALTER TABLE app_private.submission_screenshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.submission_screenshots FROM PUBLIC,anon,authenticated;
CREATE POLICY admin_read ON app_private.submission_screenshots FOR SELECT TO authenticated
  USING ((SELECT app_private.is_admin()));
GRANT SELECT ON app_private.submission_screenshots TO authenticated;

CREATE TABLE public.usage_reports (
  id uuid PRIMARY KEY REFERENCES app_private.submissions(id),
  app_id uuid NOT NULL REFERENCES public.directory_entries(app_id),
  body text NOT NULL CHECK(length(btrim(body)) BETWEEN 10 AND 4000),
  evidence_url text CHECK(length(evidence_url)<=2000 AND evidence_url ~ '^https://[a-zA-Z0-9.-]+/' AND evidence_url !~ '[@#[:space:]]'),
  usage jsonb NOT NULL CHECK(app_private.valid_usage_details(usage)),
  locale text NOT NULL CHECK(locale IN ('ko','en')),
  published_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX usage_reports_app_time ON public.usage_reports(app_id,published_at DESC,id);
CREATE TABLE public.usage_report_images (
  report_id uuid PRIMARY KEY REFERENCES public.usage_reports(id) ON DELETE CASCADE,
  bytes bytea NOT NULL CHECK(octet_length(bytes) BETWEEN 16 AND 1048576
    AND substring(bytes from 1 for 4)=decode('52494646','hex')
    AND substring(bytes from 9 for 4)=decode('57454250','hex'))
);
ALTER TABLE public.usage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_report_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.usage_reports,public.usage_report_images FROM PUBLIC,anon,authenticated;
CREATE POLICY published_read ON public.usage_reports FOR SELECT TO anon,authenticated
  USING(EXISTS(SELECT 1 FROM public.directory_entries e WHERE e.app_id=usage_reports.app_id AND e.publication='published'));
CREATE POLICY published_read ON public.usage_report_images FOR SELECT TO anon,authenticated
  USING(EXISTS(SELECT 1 FROM public.usage_reports r JOIN public.directory_entries e ON e.app_id=r.app_id
    WHERE r.id=usage_report_images.report_id AND e.publication='published'));
CREATE POLICY admin_access ON public.usage_reports TO authenticated
  USING((SELECT app_private.is_admin())) WITH CHECK((SELECT app_private.is_admin()));
CREATE POLICY admin_access ON public.usage_report_images TO authenticated
  USING((SELECT app_private.is_admin())) WITH CHECK((SELECT app_private.is_admin()));
GRANT SELECT ON public.usage_reports,public.usage_report_images TO anon;
GRANT SELECT,INSERT,DELETE ON public.usage_reports,public.usage_report_images TO authenticated;

CREATE OR REPLACE FUNCTION submission_ingress.accept(input jsonb, visitor_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE hour_value timestamptz:=date_trunc('hour',clock_timestamp()); n integer; sid uuid; aid uuid;
  hash_value text; image_value bytea; usage_value jsonb; evidence_value text; candidate jsonb;
BEGIN
  IF input IS NULL OR jsonb_typeof(input)<>'object' OR octet_length(input::text)>1420000
    OR visitor_hash IS NULL OR visitor_hash !~ '^[a-f0-9]{64}$'
    OR EXISTS(SELECT 1 FROM unnest(ARRAY['kind','app_store_id','store_url','body']) k WHERE jsonb_typeof(input->k) IS DISTINCT FROM 'string')
    OR coalesce(input->>'kind','') NOT IN ('add','correction','usage')
    OR coalesce(input->>'app_store_id','') !~ '^[1-9][0-9]{0,19}$'
    OR input->>'store_url' IS DISTINCT FROM 'https://apps.apple.com/kr/app/id'||(input->>'app_store_id')
    OR length(btrim(coalesce(input->>'body',''))) NOT BETWEEN 10 AND 4000
    THEN RAISE EXCEPTION 'Invalid submission' USING ERRCODE='23514'; END IF;
  evidence_value:=input->>'evidence_url';
  IF evidence_value IS NOT NULL AND (
    jsonb_typeof(input->'evidence_url') IS DISTINCT FROM 'string'
    OR length(evidence_value) NOT BETWEEN 1 AND 2000
    OR evidence_value !~ '^https://[a-zA-Z0-9.-]+/' OR evidence_value ~ '[@#[:space:]]')
    THEN RAISE EXCEPTION 'Invalid source' USING ERRCODE='23514'; END IF;
  SELECT id INTO aid FROM app_private.apps WHERE app_store_id=input->>'app_store_id';
  IF input->>'kind'='usage' THEN
    usage_value:=input->'usage';
    IF NOT app_private.valid_usage_details(usage_value)
      OR jsonb_typeof(input->'locale') IS DISTINCT FROM 'string' OR input->>'locale' NOT IN ('ko','en')
      OR input->'publish_consent' IS DISTINCT FROM 'true'::jsonb
      OR NOT EXISTS(SELECT 1 FROM public.directory_entries WHERE app_id=aid AND publication='published')
      THEN RAISE EXCEPTION 'Invalid usage report' USING ERRCODE='23514'; END IF;
    IF (usage_value->>'observed_on')::date>(clock_timestamp() AT TIME ZONE 'Pacific/Kiritimati')::date
      THEN RAISE EXCEPTION 'Future observation' USING ERRCODE='23514'; END IF;
    IF input ? 'screenshot_base64' THEN
      IF jsonb_typeof(input->'screenshot_base64') IS DISTINCT FROM 'string'
        OR length(input->>'screenshot_base64') NOT BETWEEN 24 AND 1398104
        OR length(input->>'screenshot_base64')%4<>0
        OR input->>'screenshot_base64' !~ '^[A-Za-z0-9+/]+={0,2}$'
        THEN RAISE EXCEPTION 'Invalid screenshot' USING ERRCODE='23514'; END IF;
      BEGIN
        image_value:=decode(input->>'screenshot_base64','base64');
      EXCEPTION WHEN data_exception THEN RAISE EXCEPTION 'Invalid screenshot' USING ERRCODE='23514'; END;
      IF octet_length(image_value) NOT BETWEEN 16 AND 1048576
        OR substring(image_value from 1 for 4)<>decode('52494646','hex')
        OR substring(image_value from 9 for 4)<>decode('57454250','hex')
        THEN RAISE EXCEPTION 'Invalid screenshot' USING ERRCODE='23514'; END IF;
    END IF;
  ELSIF evidence_value IS NULL OR octet_length(input::text)>20000 OR input ? 'screenshot_base64' THEN
    RAISE EXCEPTION 'Invalid submission' USING ERRCODE='23514';
  END IF;
  -- Keep the existing site-wide/visitor cap for every submission, including images.
  PERFORM pg_advisory_xact_lock(409,6);
  DELETE FROM app_private.submission_limits WHERE hour<hour_value-interval '1 day';
  SELECT requests INTO n FROM app_private.submission_limits WHERE bucket='global' AND hour=hour_value;
  IF coalesce(n,0)>=60 THEN RAISE EXCEPTION 'Try later' USING ERRCODE='P0429'; END IF;
  SELECT requests INTO n FROM app_private.submission_limits WHERE bucket=visitor_hash AND hour=hour_value;
  IF coalesce(n,0)>=5 THEN RAISE EXCEPTION 'Try later' USING ERRCODE='P0429'; END IF;
  INSERT INTO app_private.submission_limits(bucket,hour,requests) VALUES('global',hour_value,1),(visitor_hash,hour_value,1)
    ON CONFLICT(bucket,hour) DO UPDATE SET requests=app_private.submission_limits.requests+1;
  IF input->>'kind'='usage' THEN
    hash_value:=encode(sha256(convert_to(jsonb_build_array('usage',input->>'app_store_id',btrim(input->>'body'),
      evidence_value,usage_value,input->>'locale',encode(sha256(image_value),'hex'))::text,'UTF8')),'hex');
  ELSE
    -- Preserve historical add/correction fingerprints across this migration.
    hash_value:=encode(sha256(convert_to(jsonb_build_array(input->>'kind',input->>'app_store_id',btrim(input->>'body'),evidence_value)::text,'UTF8')),'hex');
  END IF;
  INSERT INTO app_private.submissions(kind,app_store_id,store_url,body,evidence_url,fingerprint,usage,locale,publish_consent)
    VALUES(input->>'kind',input->>'app_store_id',input->>'store_url',btrim(input->>'body'),evidence_value,hash_value,
      usage_value,CASE WHEN usage_value IS NOT NULL THEN input->>'locale' END,usage_value IS NOT NULL)
    ON CONFLICT(fingerprint) DO NOTHING RETURNING id INTO sid;
  IF sid IS NOT NULL THEN
    IF image_value IS NOT NULL THEN
      INSERT INTO app_private.submission_screenshots(submission_id,bytes) VALUES(sid,image_value);
    END IF;
    candidate:=jsonb_build_object('kind',input->>'kind','app_store_id',input->>'app_store_id',
      'source_url',evidence_value,'store_url',input->>'store_url','text',btrim(input->>'body'));
    IF usage_value IS NOT NULL THEN
      candidate:=candidate||jsonb_build_object('usage',usage_value,'locale',input->>'locale','has_screenshot',image_value IS NOT NULL);
    END IF;
    INSERT INTO app_private.review_items(app_id,submission_id,candidate_payload) VALUES(aid,sid,candidate);
  END IF;
END $$;
REVOKE ALL ON FUNCTION submission_ingress.accept(jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submission_ingress.accept(jsonb,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION app_private.decide_review(review_value uuid, expected_revision integer, decision text, reason_value text, app_revision integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item app_private.review_items; submitted app_private.submissions;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF decision IS NULL OR decision NOT IN ('approved','deferred','rejected') OR reason_value IS NULL OR length(btrim(reason_value)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE='23514'; END IF;
  SELECT * INTO item FROM app_private.review_items WHERE id=review_value FOR UPDATE;
  IF NOT FOUND OR item.revision IS DISTINCT FROM expected_revision OR item.state NOT IN ('pending','deferred') THEN
    RAISE EXCEPTION 'Review conflict' USING ERRCODE='40001'; END IF;
  IF decision='approved' THEN
    IF item.app_id IS NULL THEN RAISE EXCEPTION 'Link app first' USING ERRCODE='23514'; END IF;
    SELECT * INTO submitted FROM app_private.submissions WHERE id=item.submission_id;
    IF submitted.kind='usage' THEN
      IF NOT EXISTS(SELECT 1 FROM app_private.apps WHERE id=item.app_id AND revision=app_revision) THEN
        RAISE EXCEPTION 'App changed' USING ERRCODE='40001'; END IF;
      IF NOT EXISTS(SELECT 1 FROM public.directory_entries WHERE app_id=item.app_id AND publication='published')
        OR NOT submitted.publish_consent THEN RAISE EXCEPTION 'Cannot publish report' USING ERRCODE='23514'; END IF;
      INSERT INTO public.usage_reports(id,app_id,body,evidence_url,usage,locale)
        VALUES(submitted.id,item.app_id,submitted.body,submitted.evidence_url,submitted.usage,submitted.locale);
      INSERT INTO public.usage_report_images(report_id,bytes)
        SELECT submitted.id,bytes FROM app_private.submission_screenshots WHERE submission_id=submitted.id;
    ELSE
      PERFORM app_private.publish_app(item.app_id,app_revision,reason_value,'');
    END IF;
  END IF;
  INSERT INTO app_private.review_decisions(review_id,actor,action,reason) VALUES(item.id,app_private.actor_id(),decision,reason_value);
  UPDATE app_private.review_items SET state=decision,revision=revision+1,reason=reason_value,
    decided_by=app_private.actor_id(),decided_at=clock_timestamp() WHERE id=item.id;
END $$;
REVOKE ALL ON FUNCTION app_private.decide_review(uuid,integer,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.decide_review(uuid,integer,text,text,integer) TO authenticated;

CREATE FUNCTION app_private.withdraw_usage_report(report_value uuid, expected_revision integer, reason_value text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item app_private.review_items;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF reason_value IS NULL OR length(btrim(reason_value)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Reason required' USING ERRCODE='23514'; END IF;
  SELECT * INTO item FROM app_private.review_items WHERE submission_id=report_value FOR UPDATE;
  IF NOT FOUND OR item.revision IS DISTINCT FROM expected_revision OR item.state<>'approved'
    OR NOT EXISTS(SELECT 1 FROM app_private.submissions WHERE id=report_value AND kind='usage') THEN
    RAISE EXCEPTION 'Review conflict' USING ERRCODE='40001'; END IF;
  DELETE FROM public.usage_reports WHERE id=report_value;
  INSERT INTO app_private.review_decisions(review_id,actor,action,reason)
    VALUES(item.id,app_private.actor_id(),'rejected',reason_value);
  UPDATE app_private.review_items SET state='rejected',revision=revision+1,reason=reason_value,
    decided_by=app_private.actor_id(),decided_at=clock_timestamp() WHERE id=item.id;
END $$;
REVOKE ALL ON FUNCTION app_private.withdraw_usage_report(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app_private.withdraw_usage_report(uuid,integer,text) TO authenticated;
