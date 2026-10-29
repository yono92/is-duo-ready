# 006 data model

Existing application tables and content-addressed asset metadata remain unchanged.
Bucket: private, max2097152 bytes, MIME png/jpeg/webp, hash key64 lowercase hex + png/jpg/webp.

Configuration: current target production; exact existing Supabase ref and matching production ref; postgres directory;
ICON_STORAGE_PROVIDER=supabase; SUPABASE_STORAGE_BUCKET=app-icons; server-only SUPABASE_SECRET_KEY;
matching DATABASE_URL with verify-full. Do not overwrite local environment.

Transfer manifest: version1, allowlisted tables, row counts, hashes, actual creation time.
No auth schema/local admins/credentials. Dry-run reads both sides; apply only to empty target,
transaction rollback on mismatch, identical rerun no-op, conflicting content never overwritten.
Icon copy: stored/skipped/failed, source and target SHA256 verification, no deletion.

Readiness report: content/publication/classification/translation/evidence/icon/asset checks and
explicit reasons. No secrets, invented review dates or automatic publication.

Current hosted config: .env.hosted.production.local. No separate Preview database; no schema or object key changes were needed for project rename.
