# Tasks: 006 launch readiness
**Input**: spec/plan/research/data-model/contracts. Tests required by constitution.

## Phase 1 — setup
- [x] T001 Create validated 006 artifacts in specs/006-launch-readiness/; inspect actual providers and choose targets with user.
## Phase 2 — foundation
- [x] T002 Add strict hosted settings regression cases and validation in scripts/lib/environment.ts and tests/unit/environment.test.ts.
## Phase 3 — US1 environment and access
Independent test: invalid hosted configurations fail; private routes refresh without locale redirects.
- [x] T003 [US1] Extend src/proxy.ts and hosted authentication checks for private image requests and revoked sessions; add meaningful regression tests.
- [x] T004 [US1] Configure existing Supabase/Vercel as is-duo-ready for local + Production only, migrate schema with checksums; record exact IDs and blockers in docs/release.md.
## Phase 4 — US2 persistent content
Independent test: private image roundtrip preserves bytes; incomplete/conflicting transfer never publishes or overwrites.
- [x] T005 [US2] Add private hosted storage adapter in src/lib/icons/hosted.ts, integrate runtime and verify bounds/hash/bucket failure tests.
- [x] T006 [US2] Add explicit hosted config/migration and image transfer scripts in scripts/; require target/ref, dry-run and verified private bucket.
- [x] T007 [US2] Add allowlisted content transfer with source snapshot and empty-target/identical-replay guard in scripts/transfer-data.ts; test transaction rollback and state preservation.
- [x] T008 [US2] Transfer actual128 app drafts/icons into the existing hosted project (now Production), compare hashes/states/counts; preserve local DB and exclude local admins.
## Phase 5 — US3 launch readiness
Independent test: incomplete real content reports blockers; hosted build excludes prototype file and URL.
- [x] T009 [US3] Exclude development render from hosted files and page in assets/development/, src/lib/device-asset.ts and deployment packaging; test direct URL denial.
- [x] T010 [US3] Add scripts/release-check.ts reporting actual publication/translation/evidence/category/icon gaps and docs/release.md backup/rollback instructions.
- [ ] T011 [US3] Complete authenticated deployed-browser checks after provisioning a permanent administrator. Provider login/session/private/public/storage/TLS checks and actual application deployment/public-browser checks passed; record evidence in docs/verification.md.
- [ ] T012 [US3] Complete content review and publication. Approved Production application deployment is complete under T019; no extra DB/quota upgrade is needed after the user’s scope correction.
## Phase 6 — cross-cutting
- [x] T013 Run lint/typecheck/unit/DB/admin/fixture E2E/build/production guards and record actual results in docs/verification.md.
- [x] T014 Update README.md, .env.example, docs/assets.md, docs/environments.md and tasks with completed versus external-blocked items.

## Dependencies and execution
T001→T002→T003/T005. T004 depends on provider access; T006/T007 follow config contract; T008
requires hosted secrets and schema. T009/T010 can proceed independently from external provisioning.
T011 requires a permanent Production administrator; T012 requires verified content. T013/T014
finish local work without relabeling blocked external tasks. Research was delegated per speckit-plan;
shared code edits and browser suites remain sequential. Tests for new contracts precede implementation.

Final architecture: local PostgreSQL/files + one hosted Supabase DB/Storage + Vercel Production. Preview environment variables removed. Existing project IDs/data retained; names changed to is-duo-ready. The actual application is deployed; T011/T012 remain incomplete for permanent admin/authenticated browser checks and content publication. The later T019 run passed default Turbopack builds locally and on Vercel; earlier T013 build restrictions remain historical evidence.

## Post-publication source maintenance — user request 2026-10-29
- [x] T015 Convert authored JavaScript to strict TypeScript, update command/preload entrypoints, and verify lint/types/unit/DB/browser/build behavior; detailed run outcomes remain in docs/verification.md.
- [x] T016 Exclude optional Spec Kit/agent tooling from Git, preserve authored principles/specifications, and document the existing PostgreSQL migration/function architecture without changing applied SQL.

## Official badge publication — user decision 2026-10-29
- [x] T017 Record approval to publish apps with directly verified official Made for iPhone Duo badges, without an additional per-app approval or device evaluation; distinguish badge observations from release notes and human review timestamps in docs/PRD.md and this feature spec.
- [ ] T018 Verify app-specific official badges and KR availability, record source/wording/observation provenance, complete required content, publish eligible apps through the existing publication flow and verify public records. Initial VLLO/Timepage web checks did not establish badge presence; the existing 22 release-note candidates are not a verified badge list. Application deployment is complete under T019; T011/T012 track remaining authenticated checks and content.

## Vercel connection — user request 2026-10-29
- [x] T019 Deploy a fixed source snapshot to the existing Production project, verify GitHub/main connection and live domain, repair upload dependency exclusions, and verify public pages, anonymous admin denial, development asset denial and noindex. Keep unpublished app data private and record source provenance and remaining content/admin work in docs/release.md and docs/verification.md.

- [ ] T020 Publish the initial 128 apps under the latest owner decision, verify anonymous supported/unverified counts, filters, detail evidence and icons on the deployed site.
