# Release operations

## Environments

The maintained setup has **two environments**:

- Local development: loopback PostgreSQL and `.data/app-icons`.
- Production: one Supabase project (DB/Auth/private Storage) and one Vercel project. Both are named `is-duo-ready`.

There is no separate Preview database. Do not give Preview builds Production credentials. Hosted configuration is kept in `.env.hosted.production.local` with0600 permissions, outside Next.js automatic env loading. `DATABASE_URL` and `SUPABASE_SECRET_KEY` are server-only secrets. Never put them in `NEXT_PUBLIC_*`, Git, screenshots or issue reports.

## Current implementation status

As of2026-10-29, five schema migrations are applied to the maintainer's hosted project and repository checksums match. It holds128 actual KR app drafts,128 original icon files,22 evidence records and44 translations. Source/destination hashes match; repeat data transfer is a no-op. No apps have been published and no human review timestamps were invented. These operational datasets are not included in Git.

Actual provider checks passed for verified TLS, login/getUser/refresh/logout, revoked-session denial, ordinary/admin/revoked/anonymous RLS and private Storage. Disposable test identities were removed. No permanent hosted administrator has been provisioned.

A static preparation page was registered to handle Vercel's first-deployment behavior. **The actual application is not yet deployed to Production.** Application deployment, deployed browser verification, administrator setup and content review remain separate gates. Source-code publication is not a service launch.

## Configure and inspect

Use your own project reference and credentials; the project must match `SUPABASE_PRODUCTION_PROJECT_REF`.

```sh
npm run release:setup -- --target=production --project-ref=YOUR_PROJECT_REF
npm run release:export
npm run release:transfer-data -- --target=production --project-ref=YOUR_PROJECT_REF --source=.data/release/content-TIMESTAMP.json
npm run release:transfer-icons -- --target=production --project-ref=YOUR_PROJECT_REF --source=.data/release/content-TIMESTAMP.json
npm run release:check -- --target=production --project-ref=YOUR_PROJECT_REF
```

Commands default to dry-run; add `--apply` only after inspecting the exact target. Local `.env.local` is never a fallback for hosted commands. Schema migration apply requires a Dashboard-verified direct/session-pool connection because migration advisory locks are session-scoped. Runtime and content-transfer transactions can use the transaction pooler. Keep `sslmode=verify-full`; the driver includes the official Supabase CA and verifies the hostname. Enforce SSL at Supabase as well.

The content allowlist excludes Auth identities, local admins, visitor submissions and worker state. Historical import actor UUIDs are provenance only and confer no privileges. The private icon bucket accepts PNG/JPEG/WebP up to2MiB. Browser requests use server image routes with authentication/RLS; source URLs are provenance, not browser image dependencies.

## Readiness

The initial dataset has0 published apps,65 missing categories,128 missing human reviews,106 missing evidence/current bilingual summaries, and0 missing/corrupt icon files. `release:check` deliberately exits1 for incomplete content. Do not fabricate evidence or review dates to make it pass. Development device artwork is excluded from the public repository and hosted deployment. Automatic collection scheduling is not enabled.

## Backup and recovery

1. Keep the versioned private content manifest and original icon files on a backed-up volume. They are a **content backup**, not a full DB/Auth/Storage backup. Back up the complete database and private Storage separately before consequential changes.
2. Do not reset a populated target to make transfer pass. The tool accepts only an empty target or an identical replay, inserts in a transaction, and verifies every allowlisted table's hash. Conflicting state needs an explicit corrective migration.
3. Interrupted icon copies can be rerun; content-hash keys skip identical objects and verify repairs. Keep sources until validation and backup finish.
4. Roll back application code using a previously verified deployment of the same environment. Schema/content recovery is separate: use forward corrective migrations or restore to a separately verified destination.
5. Keep `PUBLIC_INDEXING=false` until content and deployment gates pass. Grant hosted administrator access deliberately in that environment's private allow-list; never copy local administrator credentials.

Operational credentials, provider IDs and detailed private deployment records stay in ignored local configuration/records. [Verification](verification.md) distinguishes local tests, provider tests and uncompleted deployed checks.
