-- Retire evidence publication dates end to end. Applied by the repository's
-- checksum-verified migration runner in one transaction, after compatible app code.
-- Keep evidence IDs, relationships, support decisions and review/history timestamps.
SET LOCAL lock_timeout = '5s';
LOCK TABLE app_private.evidence, app_private.import_proposals IN ACCESS EXCLUSIVE MODE;

-- Refuse ambiguous legacy records instead of silently deleting or relinking evidence.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM app_private.evidence
    GROUP BY source_id,quote,support_version,country HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Resolve date-only evidence duplicates before removing publication dates'
      USING ERRCODE='23505';
  END IF;
  IF EXISTS (SELECT 1 FROM app_private.import_proposals
    GROUP BY app_id,(proposal - 'announced_at') HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Resolve date-only proposal duplicates before removing publication dates'
      USING ERRCODE='23505';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION app_private.evidence_fingerprint() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.fingerprint := encode(sha256(convert_to(jsonb_build_array(
    NEW.quote, NEW.support_version, NEW.country
  )::text, 'UTF8')), 'hex');
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION app_private.evidence_fingerprint() FROM PUBLIC;

-- Recompute through the trigger without changing any evidence ID or source link.
UPDATE app_private.evidence SET fingerprint=fingerprint;

CREATE OR REPLACE FUNCTION app_private.save_app(payload jsonb, expected_revision integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  app app_private.apps;
  app_id_value uuid;
  original_before text;
  original_after text;
  original_locale_before text;
  translation record;
  item jsonb;
  feature jsonb;
  source_id_value uuid;
  evidence_id_value uuid;
  aliases_value text[];
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(payload) <> 'object' OR octet_length(payload::text) > 524288 THEN
    RAISE EXCEPTION 'Invalid input' USING ERRCODE='23514';
  END IF;
  IF payload ? 'aliases' AND jsonb_typeof(payload->'aliases') <> 'array' THEN
    RAISE EXCEPTION 'Invalid aliases' USING ERRCODE='23514';
  END IF;
  aliases_value := ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'aliases','[]'::jsonb)));
  app_id_value := nullif(payload->>'id','')::uuid;
  IF app_id_value IS NULL THEN
    INSERT INTO app_private.apps(app_store_id, slug, name, developer, category, aliases, original_locale)
      VALUES(payload->>'app_store_id', payload->>'slug', payload->>'name', payload->>'developer',
        nullif(payload->>'category',''), aliases_value, coalesce(payload->>'original_locale','ko'))
      RETURNING * INTO app;
    app_id_value := app.id;
  ELSE
    SELECT * INTO app FROM app_private.apps WHERE id=app_id_value FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'App not found' USING ERRCODE='P0002'; END IF;
    IF expected_revision IS DISTINCT FROM app.revision THEN
      RAISE EXCEPTION 'Edit conflict' USING ERRCODE='40001';
    END IF;
    original_locale_before := app.original_locale;
    SELECT summary INTO original_before FROM app_private.app_translations
      WHERE app_id=app.id AND locale=app.original_locale;
    UPDATE app_private.apps SET
      -- App Store ID is immutable: changing it would change the identity of the app.
      slug=payload->>'slug', name=payload->>'name', developer=payload->>'developer',
      category=nullif(payload->>'category',''), aliases=aliases_value,
      original_locale=coalesce(payload->>'original_locale','ko'), revision=revision+1, updated_at=now()
      WHERE id=app_id_value RETURNING * INTO app;
    IF payload->>'app_store_id' IS DISTINCT FROM app.app_store_id THEN
      RAISE EXCEPTION 'App Store ID is immutable' USING ERRCODE='23514';
    END IF;
  END IF;

  FOR translation IN SELECT key, value FROM jsonb_each(coalesce(payload->'translations','{}'::jsonb)) LOOP
    INSERT INTO app_private.app_translations(app_id,locale,name,summary,state)
      VALUES(app.id, translation.key, translation.value->>'name', coalesce(translation.value->>'summary',''),
        CASE WHEN translation.key=app.original_locale THEN 'current' ELSE coalesce(translation.value->>'state','current') END)
      ON CONFLICT(app_id,locale) DO UPDATE SET name=EXCLUDED.name, summary=EXCLUDED.summary, state=EXCLUDED.state;
  END LOOP;
  SELECT summary INTO original_after FROM app_private.app_translations WHERE app_id=app.id AND locale=app.original_locale;
  IF original_before IS NOT NULL AND (original_before IS DISTINCT FROM original_after OR original_locale_before IS DISTINCT FROM app.original_locale) THEN
    UPDATE app_private.app_translations SET state='needs-review' WHERE app_id=app.id AND locale<>app.original_locale;
  END IF;
  INSERT INTO app_private.app_store_listings(app_id,store_url,current_version,release_notes)
    VALUES(app.id, 'https://apps.apple.com/kr/app/id'||app.app_store_id,
      nullif(payload->>'current_version',''),nullif(payload->>'release_notes',''))
    ON CONFLICT(app_id,country) DO UPDATE SET current_version=EXCLUDED.current_version,
      release_notes=EXCLUDED.release_notes;
  INSERT INTO app_private.app_support(app_id,status,summary,support_version,investigation_reason)
    VALUES(app.id,coalesce(payload->>'status','unknown'),coalesce(original_after,''),
      nullif(payload->>'support_version',''),coalesce(payload->>'investigation_reason',''))
    ON CONFLICT(app_id,country) DO UPDATE SET status=EXCLUDED.status, summary=EXCLUDED.summary,
      support_version=EXCLUDED.support_version,investigation_reason=EXCLUDED.investigation_reason;

  IF payload ? 'evidence' THEN
    IF jsonb_typeof(payload->'evidence') <> 'array' OR jsonb_array_length(payload->'evidence') > 50 THEN
      RAISE EXCEPTION 'Invalid evidence' USING ERRCODE='23514';
    END IF;
    DELETE FROM app_private.support_features WHERE app_id=app.id;
    DELETE FROM app_private.app_evidence WHERE app_id=app.id;
    FOR item IN SELECT value FROM jsonb_array_elements(payload->'evidence') LOOP
      INSERT INTO app_private.sources(url,title,kind,official_confirmed)
        VALUES(item->>'url',item->>'title',item->>'kind',coalesce((item->>'official_confirmed')::boolean,false))
        ON CONFLICT(url) DO UPDATE SET title=EXCLUDED.title,kind=EXCLUDED.kind,official_confirmed=EXCLUDED.official_confirmed
        RETURNING id INTO source_id_value;
      INSERT INTO app_private.evidence(source_id,quote,support_version,country)
        VALUES(source_id_value,item->>'quote',nullif(item->>'support_version',''),'KR')
        ON CONFLICT(source_id,fingerprint) DO UPDATE SET quote=EXCLUDED.quote
        RETURNING id INTO evidence_id_value;
      INSERT INTO app_private.app_evidence(app_id,evidence_id) VALUES(app.id,evidence_id_value)
        ON CONFLICT DO NOTHING;
      IF jsonb_typeof(coalesce(item->'features','[]'::jsonb)) <> 'array'
        OR jsonb_array_length(coalesce(item->'features','[]'::jsonb)) > 20 THEN
        RAISE EXCEPTION 'Invalid features' USING ERRCODE='23514';
      END IF;
      FOR feature IN SELECT value FROM jsonb_array_elements(coalesce(item->'features','[]'::jsonb)) LOOP
        INSERT INTO app_private.support_features(app_id,feature_key,description,evidence_id)
          VALUES(app.id,feature->>'key',feature->>'description',evidence_id_value);
      END LOOP;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('id',app.id,'revision',app.revision,'slug',app.slug);
END
$$;
REVOKE ALL ON FUNCTION app_private.save_app(jsonb,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.save_app(jsonb,integer) TO authenticated;

CREATE OR REPLACE FUNCTION app_private.publish_app(app_id_value uuid, expected_revision integer, reason text, internal_note_value text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  app app_private.apps;
  support app_private.app_support;
  listing app_private.app_store_listings;
  previous public.directory_entries;
  content jsonb;
  evidence_value jsonb;
  features_value jsonb;
  translations_value jsonb;
  names_value jsonb;
  reviewed timestamptz := statement_timestamp();
  changed timestamptz;
  is_change boolean;
  support_keys text[] := ARRAY['status','translations','supportVersion','investigationReason','evidence','features'];
  old_support jsonb;
  new_support jsonb;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF reason IS NULL OR length(btrim(reason)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Change reason required' USING ERRCODE='23514';
  END IF;
  SELECT * INTO app FROM app_private.apps WHERE id=app_id_value FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'App not found' USING ERRCODE='P0002'; END IF;
  IF expected_revision IS DISTINCT FROM app.revision THEN RAISE EXCEPTION 'Edit conflict' USING ERRCODE='40001'; END IF;
  -- A source can be shared by different apps. Keep its confirmation/content stable
  -- between evidence validation and snapshot creation, even during another app's edit.
  PERFORM 1 FROM app_private.app_evidence ae
    JOIN app_private.evidence e ON e.id=ae.evidence_id JOIN app_private.sources s ON s.id=e.source_id
    WHERE ae.app_id=app.id ORDER BY s.id,e.id FOR SHARE OF s,e;
  SELECT * INTO support FROM app_private.app_support WHERE app_id=app.id AND country='KR';
  IF NOT FOUND THEN RAISE EXCEPTION 'Support review required' USING ERRCODE='23514'; END IF;
  SELECT * INTO listing FROM app_private.app_store_listings WHERE app_id=app.id AND country='KR';
  IF NOT FOUND OR app.category IS NULL OR listing.store_url !~ ('id'||app.app_store_id||'$') THEN
    RAISE EXCEPTION 'Category and KR listing required' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM app_private.app_translations WHERE app_id=app.id AND locale=app.original_locale
    AND state='current' AND length(btrim(summary)) > 0) THEN
    RAISE EXCEPTION 'Original summary required' USING ERRCODE='23514';
  END IF;
  IF support.status='unknown' THEN
    IF length(btrim(support.investigation_reason))=0 THEN
      RAISE EXCEPTION 'Investigation reason required' USING ERRCODE='23514';
    END IF;
  ELSIF NOT EXISTS(SELECT 1 FROM app_private.app_evidence ae
    JOIN app_private.evidence e ON e.id=ae.evidence_id
    JOIN app_private.sources s ON s.id=e.source_id
    WHERE ae.app_id=app.id AND s.official_confirmed AND e.country='KR'
      AND (support.support_version IS NULL OR e.support_version IS NULL OR support.support_version=e.support_version)) THEN
    RAISE EXCEPTION 'Official evidence required' USING ERRCODE='23514';
  END IF;
  IF EXISTS(SELECT 1 FROM app_private.support_features f
    JOIN app_private.evidence e ON e.id=f.evidence_id JOIN app_private.sources s ON s.id=e.source_id
    WHERE f.app_id=app.id AND NOT s.official_confirmed) THEN
    RAISE EXCEPTION 'Features require official evidence' USING ERRCODE='23514';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',e.id,'url',s.url,'title',s.title,'kind',s.kind,
    'quote',e.quote,'supportVersion',e.support_version,'country',e.country) ORDER BY e.id),'[]'::jsonb)
    INTO evidence_value FROM app_private.app_evidence ae JOIN app_private.evidence e ON e.id=ae.evidence_id
    JOIN app_private.sources s ON s.id=e.source_id WHERE ae.app_id=app.id AND s.official_confirmed;
  SELECT coalesce(jsonb_agg(jsonb_build_object('key',feature_key,'description',description,'evidenceId',evidence_id)
    ORDER BY feature_key),'[]'::jsonb) INTO features_value FROM app_private.support_features WHERE app_id=app.id;
  SELECT jsonb_object_agg(locale,jsonb_build_object('summary',summary,'state',state)),
    jsonb_build_object('ko',app.name,'en',app.name) || jsonb_object_agg(locale,name)
    INTO translations_value,names_value FROM app_private.app_translations WHERE app_id=app.id;
  content := jsonb_build_object(
    'slug',app.slug,'fictional',false,'publication','published','country','KR',
    'names',names_value,'aliases',to_jsonb(app.aliases),'developer',app.developer,'category',app.category,
    'status',support.status,'icon','box','originalLocale',app.original_locale,'translations',translations_value,
    'storeUrl',listing.store_url,'currentVersion',listing.current_version,'supportVersion',support.support_version,
    'investigationReason',CASE WHEN support.status='unknown' THEN support.investigation_reason ELSE NULL END,
    'evidence',evidence_value,'features',features_value,
    'previousSlugs',(SELECT coalesce(jsonb_agg(old_slug ORDER BY old_slug),'[]'::jsonb) FROM app_private.slug_redirects WHERE app_id=app.id)
  );
  SELECT * INTO previous FROM public.directory_entries WHERE app_id=app.id;
  SELECT jsonb_object_agg(key,value) INTO old_support FROM jsonb_each(coalesce(previous.snapshot,'{}'::jsonb)) WHERE key=ANY(support_keys);
  SELECT jsonb_object_agg(key,value) INTO new_support FROM jsonb_each(content) WHERE key=ANY(support_keys);
  is_change := previous.app_id IS NULL OR previous.publication<>'published' OR old_support IS DISTINCT FROM new_support;
  changed := CASE WHEN is_change THEN reviewed ELSE previous.support_changed_at END;
  content := content || jsonb_build_object('reviewedAt',reviewed,'supportChangedAt',changed);
  INSERT INTO public.directory_entries(app_id,slug,publication,reviewed_at,support_changed_at,snapshot)
    VALUES(app.id,app.slug,'published',reviewed,changed,content)
    ON CONFLICT(app_id) DO UPDATE SET slug=EXCLUDED.slug,publication=EXCLUDED.publication,
      reviewed_at=EXCLUDED.reviewed_at,support_changed_at=EXCLUDED.support_changed_at,snapshot=EXCLUDED.snapshot;
  IF is_change THEN
    INSERT INTO public.support_history(app_id,before_snapshot,after_snapshot,change_reason,changed_at)
      VALUES(app.id,previous.snapshot,content,reason,reviewed);
  END IF;
  UPDATE app_private.app_support SET reviewed_at=reviewed WHERE app_id=app.id AND country='KR';
  UPDATE app_private.apps SET publication='published',revision=revision+1,updated_at=reviewed WHERE id=app.id RETURNING * INTO app;
  INSERT INTO app_private.review_events(app_id,actor,action,internal_note)
    VALUES(app.id,app_private.actor_id(),CASE WHEN previous.app_id IS NULL THEN 'publish' ELSE 'correct' END,internal_note_value);
  RETURN jsonb_build_object('id',app.id,'revision',app.revision,'slug',app.slug);
END
$$;
REVOKE ALL ON FUNCTION app_private.publish_app(uuid,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.publish_app(uuid,integer,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION app_private.import_app(metadata jsonb, proposal jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE aid uuid; old_metadata jsonb; created boolean := false; changed boolean := false;
  added integer; slug_value text; item jsonb; fingerprint_value text;
BEGIN
  IF NOT app_private.is_admin() THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(metadata) IS DISTINCT FROM 'object' OR jsonb_typeof(proposal) IS DISTINCT FROM 'object'
    OR octet_length(metadata::text) > 150000 OR octet_length(proposal::text) > 30000
    OR metadata->>'app_store_id' IS NULL OR metadata->>'fetched_at' IS NULL
    THEN RAISE EXCEPTION 'Invalid import' USING ERRCODE='23514'; END IF;
  -- Old clients may submit the retired field; never persist it in new proposals.
  proposal := proposal - 'announced_at';
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

-- Remove the field from current projections and resumable suggestions without
-- publishing a new support event. Immutable support_history snapshots stay intact.
UPDATE public.directory_entries d SET snapshot=jsonb_set(snapshot,'{evidence}',
  (SELECT coalesce(jsonb_agg(item - 'announcedAt' ORDER BY ordinal),'[]'::jsonb)
   FROM jsonb_array_elements(d.snapshot->'evidence') WITH ORDINALITY AS entry(item,ordinal)))
WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(d.snapshot->'evidence') item
  WHERE item ? 'announcedAt');
UPDATE app_private.import_rows SET proposal=proposal - 'announced_at'
  WHERE proposal ? 'announced_at';
UPDATE app_private.import_proposals
  SET proposal=proposal - 'announced_at',
    fingerprint=encode(sha256(convert_to((proposal - 'announced_at')::text,'UTF8')),'hex')
  WHERE proposal ? 'announced_at';

ALTER TABLE app_private.evidence DROP COLUMN announced_at;
