# Research and decisions

- Decision: input URLs are parsed to numeric App Store IDs; fetch only https://itunes.apple.com/lookup?id=...&country=kr&entity=software with redirect:error, timeout and bounded response. Never fetch arbitrary source_url; it is stored as unverified proposal for review.
- Decision: max 200 CSV rows / 512 KiB, max 10 rows per server batch with stable resumable row outcomes. Request spacing at least 3 seconds for live Lookup; max 2 retries for transient network/429/5xx with bounded Retry-After/backoff. No network in public rendering.
- Decision: accept BOM, CRLF, commas and newlines in quoted fields, escaped double quotes; reject malformed quotes/duplicate headers/missing app_store_url/extra columns with row errors. Stable keys prevent duplicate imports.
- Decision: normalize only observed Apple fields. Missing developer/name makes a row invalid; missing version/notes/icon is allowed. Unmapped Apple category requires administrator classification before publication; do not invent a category or support state.
- Decision: proposed status/source/quote remain private import proposals; no official confirmation, review timestamp or publication is inferred. Existing published snapshot stays unchanged. New apps are drafts.
- Decision: actual API probe is separate from deterministic tests, stores no secrets, writes no public support claims and documents exact fetch time, country and field presence. Candidate 200 / reviewed 100 are launch data goals, not an excuse to fabricate evidence.

## Verified references (2026-10-29)
- Installed Next.js docs: node_modules/next/dist/docs/01-app/02-guides/server-actions.md, authentication.md; 03-api-reference/04-functions/cookies.md and revalidatePath.md. Async cookies, per-action auth, post-commit revalidation.
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath : invalidate route paths after commit before redirect.
- https://www.postgresql.org/docs/17/ddl-rowsecurity.html : non-owner RLS tests, default deny, RLS does not hide columns.
- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs : SSR cookies, verified identity. getSession user alone is not trusted.
- https://supabase.com/changelog : checked current changelog; October TLS cipher retirement is not a local SQL blocker. Markdown endpoint was unsupported by web tool and shell DNS restricted; HTML index was accessible.
- https://performance-partners.apple.com/search-api : KR parameter must be explicit, software lookup and API media use terms; no documented Duo support field assumed.

Hosted live Auth and production project configuration are not validated by local test identity or SQL tests. Final reporting must keep those 006 external checks explicit.
