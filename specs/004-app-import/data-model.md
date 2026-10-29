# Data model

- `app_private.import_runs`: UUID, verified admin actor, input fingerprint, created_at. Totals are derived from rows, not independently mutable counters.
- `app_private.import_rows`: run_id + row_number (1..200), input URL, app_store_id, pending/created/updated/duplicate/error state, app_id, safe error_code, retryable flag, normalized proposal JSON, completed_at. All rows remain private.
- `app_private.import_proposals`: app_id + SHA-256 fingerprint uniqueness, normalized unverified proposal JSON and actual creation time. Replays do not create duplicate proposals or official evidence.
- `app_private.import_clock`: one row plus transaction-scoped global advisory lock; actual attempt time enforces >=3-second spacing across admin sessions and retries.
- `app_store_listings.observed_metadata`: observed name/developer/genre and listing facts, with nullable optional fields. Last successful fetch time is separate from human review time.

All new tables have admin-only RLS and explicit grants. Imports process one row per protected action (within the <=10 row batch bound), atomically commit its result, and resume pending rows. Failed lookups can be reset for retry; successful rows are not repeated. A savepoint rolls back failed metadata writes while preserving a safe row failure result.

New apps are drafts with mapped category or null when unmapped. Existing manually curated app fields/categories are not overwritten; updated observed metadata remains available for review. Private source/status proposals never confirm official sources or change support. Public snapshots, support evidence, review dates and public history are untouched until explicit administrator review.

## Local icon assets amendment

`public.app_icon_assets` (migration 005): app_id primary/foreign key, content-addressed storage_path,
sha256, content_type, byte_size, width, height, source_url and fetched_at. RLS permits anonymous
reads only for published directory entries and administrator writes/reads for all states. This is
the exception to the import tables' admin-only read policy above. Files live outside public/ in
an ignored persistent directory; the database contains metadata, not binary bytes. Collection
validates and writes bytes before updating metadata, and a savepoint preserves the existing asset
on failure. A source-URL comparison rejects obsolete metadata and monotonic collection timestamps
prevent an older collection from replacing a newer pointer. Icon changes do not change human
review timestamps or support snapshots. Back up files and database together.
