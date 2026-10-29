# Interface contract

## UI
`/[locale]/admin/login`: localized email/password, provider-unconfigured notice, errors without account enumeration; safe return destination restricted to locale admin paths. Logout clears/revokes session.
`/[locale]/admin`: counts and links; requires admin on server.
`/[locale]/admin/apps`: search drafts/published/archived and create.
`/[locale]/admin/apps/[id]`: basic info, translations, KR listing, support proposal, sources/quotes/features, publish/correct/archive. Saved revisions and explicit publication confirmation; localized field errors and conflict feedback.
## Mutation boundary
Every action authenticates, checks current admin membership, validates FormData and executes SQL as a fixed non-owner role. Client actor/review date/approval flags are not trusted. Explicit human official-source confirmation is accepted only from an authorized editor. Direct requests have the same checks as UI.
Publication input: app ID, expected revision, public change reason; server creates actual review timestamp and sanitized snapshot. Unknown requires recorded investigation reason. Supported/planned/unsupported require confirmed official source with quote for KR. All changes atomic; no partial success response. Post-commit revalidatePath for both locales.
## Local commands
`db:migrate`: local loopback target only, checksums + advisory lock, no destructive reset. `test:db`: isolated database, actual role policies, rollback failure injection. Hosted application credentials and migrations are configured in 006; no remote mutations here.
