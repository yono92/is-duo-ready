> Final user correction: use local development + one Production environment only. Earlier Preview/Production provisioning research below is historical; its separate-Preview recommendation is superseded. Existing projects are renamed is-duo-ready and reused.

# 006 Research

- Decision: private app-icons bucket, same-origin routes authorize before server download.
  Rationale: public buckets bypass read restrictions and expose draft/archived files.
  https://supabase.com/docs/guides/storage/buckets/fundamentals
  https://supabase.com/docs/reference/javascript/storage-from-download
- Decision: retain role-scoped PG queries; explicit hosted tools, matching refs and verify-full.
  Rationale: do not weaken local-only migration/sync guards.
- Decision: refresh /api/admin without locale rewrite; verify getUser and live session_id for
  sensitive operations, because JWT can remain valid after logout.
  https://supabase.com/docs/guides/auth/sessions ; installed Next proxy guide.
- Decision: move prototype out of public and serve locally only. HTML hiding alone is insufficient.
- Decision: test staged deployment before promotion; icn1 near Supabase Seoul.
  https://vercel.com/docs/deployments/promoting-a-deployment
- Changelog reviewed: upcoming HTTP CBC TLS deprecation is compatible with Node22; new schema
  has no ltree, legacy PGP or custom operators affected by PG17.11 changes.
  https://supabase.com/changelog/cbc-tls-ciphers-deprecated
  https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes
- Actual provisioning: Preview YOUR_PROJECT_REF created. Production blocked by quota2 active
  free projects. Cost API returned monthly0 but creation still fails quota. No paid plan change.
  Vercel MCP creation403; same-team CLI created YOUR_VERCEL_PROJECT_ID.
- Read-only research delegated per speckit-plan; no agent mutation.
