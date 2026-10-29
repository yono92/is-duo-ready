# Research and decisions

- Decision: SQL migrations in db/migrations, checksum history and transaction/advisory-lock runner. Rationale: user explicitly selected standalone PostgreSQL and removed Supabase CLI. No CLI or stack is reinstalled merely to name migration files. Alternative: Supabase CLI migration workflow belongs to later hosted adoption.
- Decision: anon/authenticated NOLOGIN roles are prepared only in local bootstrap; application SQL is portable PostgreSQL 17. Transactions use fixed roles and parameterized transaction-local verified identity. Rationale: test actual RLS without reproducing the Auth service.
- Decision: normalized working records in app_private and reviewed projections in public.directory_entries/public.support_history. Rationale: saved edits/imports never silently overwrite published evidence; private notes/reviewer UUID never enter public tables. Alternative: exposing all working tables with RLS would not hide sensitive columns or pending edits.
- Decision: Supabase SSR email/password login and getUser on privileged operations; current admin_users membership is checked independently. Local-only explicitly configured development/test identity may exercise UI but is never evidence of live Supabase Auth correctness. Missing config fails closed. No signup UI or self-service administrator grants.
- Decision: SQL publication function validates status/evidence or investigation reason and runs snapshot/history/review audit in one transaction; lock app row plus revision check to reject stale editors. Function remains security invoker; any helper using definer privileges must be narrowly scoped and justified.
- Decision: all private tables have RLS; admin_users has self-row read policy, with writes reserved for administrative CLI/migration credential. Public history has no application UPDATE/DELETE grant. Public write policies require admin membership.
- Decision: test-only fictional apps use an isolated database and are cleaned up. No fake dates or supporting links on real imported apps.

## Verified references (2026-10-29)
- Installed Next.js docs: node_modules/next/dist/docs/01-app/02-guides/server-actions.md, authentication.md; 03-api-reference/04-functions/cookies.md and revalidatePath.md. Async cookies, per-action auth, post-commit revalidation.
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath : invalidate route paths after commit before redirect.
- https://www.postgresql.org/docs/17/ddl-rowsecurity.html : non-owner RLS tests, default deny, RLS does not hide columns.
- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs : SSR cookies, verified identity. getSession user alone is not trusted.
- https://supabase.com/changelog : checked current changelog; October TLS cipher retirement is not a local SQL blocker. Markdown endpoint was unsupported by web tool and shell DNS restricted; HTML index was accessible.
- https://performance-partners.apple.com/search-api : KR parameter must be explicit, software lookup and API media use terms; no documented Duo support field assumed.

Hosted live Auth and production project configuration are not validated by local test identity or SQL tests. Final reporting must keep those 006 external checks explicit.
