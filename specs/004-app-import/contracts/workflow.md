# Interface contract

POST through protected server actions: URL list or UTF-8 CSV <=512 KiB and <=200 rows. Columns app_store_url (required), source_url, proposed_status, evidence_summary, announced_at, support_version. Unknown columns rejected to catch typos. Source URL must be HTTPS, without credentials and public hostname; no network fetch occurs for it. Never accept actor or review timestamp from input.
Preview/parse reports input errors before fetch. Batches max 10 rows; output row number, original safe URL, outcome code, draft edit link. Resume/retry failed rows without duplicating app/evidence. Rate limit and timeout errors are translated. Cancel stops further batches; successful drafts persist.
Lookup rejects country mismatch, wrong trackId, zero/multiple unexpected results, wrong wrapper type and oversized body. Imported API evidence fields are suggestions only; 002 manual review is required before public support state changes.

## Stored image contract

- `GET /api/app-icons/{uuid}` returns original stored PNG/JPEG/WebP bytes only for published apps.
- `GET /api/admin/app-icons/{uuid}` requires a verified administrator and permits drafts/archived apps.
- Invalid IDs, absent metadata and unauthorized assets return 404; a storage/database failure returns 503.
- Responses are `private, no-store`, with nosniff, noindex and same-origin resource policy. No request
  redirects to an external image. The UI falls back to a generic icon if the response fails.
- Import collection is best-effort after metadata import. `npm run icons:sync` retries absent/corrupt
  files, skips verified matching files, and `--refresh` downloads even when the source URL is unchanged.
- Download sources must match the explicit HTTPS Apple image-host allowlist; redirects are rejected.
  Bound downloads to 8 seconds, 2 MiB and one fully decoded image up to 2048×2048 pixels.
- The current adapter stores local files and rejects Vercel; a hosted Supabase Storage adapter is future work.
