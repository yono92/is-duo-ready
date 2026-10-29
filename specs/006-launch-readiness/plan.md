# 006 implementation plan — final scope

## Architecture
Local development uses the existing loopback PostgreSQL and .data/app-icons. One hosted Supabase project and Vercel Production serve the operational target. Both project names are is-duo-ready; service display remains Is Duo Ready?. Reuse ref YOUR_PROJECT_REF and Vercel ID YOUR_VERCEL_PROJECT_ID. No separate Preview DB or app deployment.

## Configuration and access
Use .env.hosted.production.local (0600), never .env.production.local that Next could load during local builds. Runtime uses postgres mode, private Storage, verified Supabase sessions and request-scoped anon/authenticated roles with RLS. Admin membership and auth.sessions are checked per request. Enforce SSL and verify the official CA/hostname. Vercel Production holds server secrets; Preview has no app configuration and fails the hosted guard.

## Content and imagery
Retain original icon bytes under content-hash keys in a private size-limited bucket. Fixed allowlist content snapshot/transfer excludes local auth/admin grants, submissions and worker state; default dry-run, empty-or-identical target, transaction rollback and post-copy hashes. Never publish or add review dates during transfer. Exclude development render from hosted UI, routes and upload.

## Delivery and verification
Local lint/typecheck/unit/isolated DB/admin+public E2E/build/production guards precede actual application deployment. Provider session/role/storage/TLS checks are recorded separately from deployed browser tests. The user approved only a static initial Production bootstrap to overcome Vercel first-deployment routing; it contains no app or DB connection. Local+Production correction supersedes the initial 3-environment plan. Record all incomplete gates honestly in docs/release.md and docs/verification.md.
