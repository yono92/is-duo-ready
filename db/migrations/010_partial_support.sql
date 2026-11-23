-- Partial support: official sources name iPhone Duo but leave the supported scope unclear.
-- Snapshot publication already requires official evidence for every status except unknown.
ALTER TABLE app_private.app_support DROP CONSTRAINT app_support_status_check;
ALTER TABLE app_private.app_support ADD CONSTRAINT app_support_status_check
  CHECK (status IN ('supported','partial','planned','unknown','unsupported'));
