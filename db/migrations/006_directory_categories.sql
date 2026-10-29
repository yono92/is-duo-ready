-- Extend the existing taxonomy using the stored Apple KR primary genre IDs.
-- No publication, support, evidence, grants or RLS policies change here.
ALTER TABLE app_private.apps DROP CONSTRAINT apps_category_check;
ALTER TABLE app_private.apps ADD CONSTRAINT apps_category_check CHECK (category IN (
  'productivity','graphics-design','music','books','travel','navigation',
  'photo-video','entertainment','lifestyle',
  'reference','sports','utilities','games','food-drink','shopping','finance','education','business','health-fitness','weather','news','social-networking'
));
