-- Files live outside public/. Every read goes through an authorized application route.
CREATE TABLE public.app_icon_assets (
  app_id uuid PRIMARY KEY REFERENCES app_private.apps(id) ON DELETE CASCADE,
  storage_path text NOT NULL CHECK (storage_path ~ '^[a-f0-9]{64}\.(png|jpg|webp)$'),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  content_type text NOT NULL CHECK (content_type IN ('image/png','image/jpeg','image/webp')),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 2097152),
  width integer NOT NULL CHECK (width BETWEEN 1 AND 2048),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 2048),
  source_url text NOT NULL CHECK (length(source_url) <= 2000),
  fetched_at timestamptz NOT NULL,
  CHECK (split_part(storage_path,'.',1) = sha256)
);
ALTER TABLE public.app_icon_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_icon_assets FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.app_icon_assets TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.app_icon_assets TO authenticated;
CREATE POLICY published_icon_read ON public.app_icon_assets FOR SELECT TO anon,authenticated
  USING (EXISTS (SELECT 1 FROM public.directory_entries d
    WHERE d.app_id=app_icon_assets.app_id AND d.publication='published'));
CREATE POLICY admin_icon_access ON public.app_icon_assets TO authenticated
  USING ((SELECT app_private.is_admin())) WITH CHECK ((SELECT app_private.is_admin()));
