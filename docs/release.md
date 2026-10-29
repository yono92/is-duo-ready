# Release operations

## Environments

The maintained setup has **two environments**:

- Local development: loopback PostgreSQL and `.data/app-icons`.
- Production: one Supabase project (DB/Auth/private Storage) and one Vercel project. Both are named `is-duo-ready`.

There is no separate Preview database. Do not give Preview builds Production credentials. Hosted configuration is kept in `.env.hosted.production.local` with0600 permissions, outside Next.js automatic env loading. `DATABASE_URL` and `SUPABASE_SECRET_KEY` are server-only secrets. Never put them in `NEXT_PUBLIC_*`, Git, screenshots or issue reports.

## Current implementation status

Before the initial publication on 2026-10-29, five schema migrations were applied to the maintainer's hosted project and repository checksums match. It holds128 actual KR app drafts,128 original icon files,22 evidence records and44 translations. Source/destination hashes match; repeat data transfer is a no-op. No apps have been published and no human review timestamps were invented. These operational datasets are not included in Git.

Actual provider checks passed for verified TLS, login/getUser/refresh/logout, revoked-session denial, ordinary/admin/revoked/anonymous RLS and private Storage. Disposable test identities were removed. No permanent hosted administrator has been provisioned.

A static preparation page was initially registered to handle Vercel's first-deployment behavior. On 2026-10-29 the user requested Vercel connection and the actual Next.js application was deployed to Production at [is-duo-ready.vercel.app](https://is-duo-ready.vercel.app/ko). Public ko/en pages, database-backed empty results, language switching, unauthenticated administrator denial, prototype-image denial and noindex were verified. Permanent administrator setup, authenticated deployed-browser flows and content publication remain open; the public directory still has zero published apps.

The project is connected to `yono92/is-duo-ready` with production branch `main`. This release uploads a fixed snapshot of the working tree based on `075d931`, including uncommitted work; it is not a deployment of that commit alone. Snapshot SHA-256: `8603e913ddbe25727b8ecef5ef3b4b086217c51d7520617ce5f4e3d2c6b9f277`. Later edits in other active chats are not automatically part of this snapshot. Commit and push the reviewed source before relying on Git-driven deployments to reproduce it. Preview has no production credentials.

The deployment upload excludes local environment files, data, optional agent tooling and development artwork. It also excludes `scripts/verify-db-production.ts`, whose test helpers are intentionally excluded. Local type checking still includes that script. `NEXT_PUBLIC_SITE_URL` is the production origin above; `PUBLIC_INDEXING=false` remains enabled until content is ready. See docs/verification.md for deployment IDs and checks.

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

Historical pre-publication check: the initial dataset had0 published apps,65 missing categories,128 missing human reviews,106 missing evidence/current bilingual summaries, and0 missing/corrupt icon files. `release:check` deliberately exits1 for incomplete content. Do not fabricate evidence or review dates to make it pass. Development device artwork is excluded from the public repository and hosted deployment. Automatic collection scheduling is not enabled.

## Backup and recovery

1. Keep the versioned private content manifest and original icon files on a backed-up volume. They are a **content backup**, not a full DB/Auth/Storage backup. Back up the complete database and private Storage separately before consequential changes.
2. Do not reset a populated target to make transfer pass. The tool accepts only an empty target or an identical replay, inserts in a transaction, and verifies every allowlisted table's hash. Conflicting state needs an explicit corrective migration.
3. Interrupted icon copies can be rerun; content-hash keys skip identical objects and verify repairs. Keep sources until validation and backup finish.
4. Roll back application code using a previously verified deployment of the same environment. Schema/content recovery is separate: use forward corrective migrations or restore to a separately verified destination.
5. Keep `PUBLIC_INDEXING=false` until content and deployment gates pass. Grant hosted administrator access deliberately in that environment's private allow-list; never copy local administrator credentials.

Operational credentials, provider IDs and detailed private deployment records stay in ignored local configuration/records. [Verification](verification.md) distinguishes local tests, provider tests and uncompleted deployed checks.


## Initial full-directory release — 2026-10-29

The latest owner instruction authorized publishing all 128 existing KR apps. Production now has 22 supported apps with preserved official release-note evidence and 106 `unknown` apps displayed as “미지원 · 근거 미확인” / “Unsupported · unverified”. No official non-support evidence or device test was invented. Migration 006 extends categories; 65 null categories were filled from their stored Apple primary genres. The original local collection DB is unchanged.

`node --import tsx scripts/publish-initial-directory.ts --target=production --project-ref=ixinxqxbwrkywulzlipt --source=docs/data/initial-app-import.json` first ran with rollback, then with `--apply` after the new UI deployment. The script only accepts the original complete draft batch; rerunning after publication refuses to overwrite it. The pre-publication backup is private under `.data/release/`. The batch uses an ephemeral operation ID through the existing authenticated publication function, deletes its transaction-local allow-list entry before commit, and leaves no persistent administrator. There are 128 publication events and 128 public history records. Publication/update timestamps are actual execution timestamps, not claimed human/device-test dates.

Vercel production deployment: `dpl_3tofw434PXJHr5pQxXc8aFMMqafQ`, promoted to [is-duo-ready.vercel.app](https://is-duo-ready.vercel.app/ko). Uploaded 231 files from a fixed working-tree snapshot with SHA-256 `b0fc24cd34b4e762f31cf251a8cccbfa7848c4fb46bfcfc0f74819c1a3b1898b`. Remote default Turbopack build passed. Secrets, local observations, test files and development-only artwork were excluded.

Production `release:check`: published128, drafts0, all missing-content counters0, icons128, corrupt/missing files0, ready=true. Browser verified total128 and the unverified filter106. Public HTTP checks passed for supported22, unverified106, English128, Social Networking5, supported/unverified details and a real image/jpeg icon. Anonymous admin collection API remains401; development artwork remains404. Existing noindex policy and permanent-admin setup are separate from this content release.

## Original 3D concept release — 2026-10-30

At the user's request, the original Three.js concept now appears on production independently of the
optional development PNG. Loading and WebGL failure use the repository's original SVG schematic.
The unapproved PNG remains excluded and its hosted route returns 404.

Production deployment `dpl_DGNx1wrhHQ9agbhNdrsJ7TRoFP1E` was built with production settings,
checked through authenticated HTTP requests, then promoted to
[is-duo-ready.vercel.app](https://is-duo-ready.vercel.app/ko). Both public locales render a working
WebGL canvas; rotation, edge folding/unfolding and reset were checked in the deployed browser.
The fixed source is HEAD `9e39214` plus the 3D gate/fallback change and its documentation; concurrent
popular-app work is excluded. The 237-entry upload manifest SHA-256 is
`dba59929a4a5abb40380b8084840f465d0ea9790f343ca96db7b80fb815397ed`.
This release did not change the database or environment configuration. The initial direct deployment
preceded the Git commit; the user's follow-up requests syncing this 3D change to main through a commit
and push. See docs/verification.md for actual validation results and build limitations.
