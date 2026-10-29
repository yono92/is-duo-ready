# Tasks: 002-admin-evidence

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/workflow.md.
**Tests**: Required by repository constitution/PRD.

## Phase 1: Setup
- [x] T001 Resolve Spec Kit templates and create validated spec/design/contracts in specs/002-admin-evidence/; retain existing checkout and PostgreSQL.
- [x] T002 Add checksum/advisory-lock transactional local migration runner in scripts/migrate.mjs and scripts/lib/database.mjs; isolated test database runner in scripts/test-db.mjs, package.json.
## Phase 2: Foundation
- [x] T003 Define roles, private working tables and public snapshots with RLS in db/migrations/; enforce UUID IDs, app_store_id digits unique, slug lowercase letters/digits/hyphen unique, ko/en locale, KR country, draft/published/archived, revision positive; draft category nullable until publication.
- [x] T004 Add transaction-scoped non-owner identity wrapper in src/lib/db/ and environment guards in scripts/lib/environment.mjs; no credentials in logs and no pool identity leakage.
## Phase 3: US1 — Authentication and authorization
Independent test: anonymous/ordinary/admin/revoked identities attempt the same reads and writes.
- [x] T005 [US1] Write actual non-owner RLS and identity-isolation integration tests in tests/integration/access.test.mjs; include no self-granted administrator and no direct anonymous write.
- [x] T006 [US1] Implement Supabase SSR login/logout/verified user and explicit local-only test identity gates in src/lib/admin/auth.ts, src/lib/supabase/, src/proxy.ts; fail closed when unset.
- [x] T007 [US1] Implement translated login/admin shell in src/app/[locale]/admin/ and src/messages/{ko,en}.json; validate safe redirect and recheck role on each action.
## Phase 4: US2 — Drafts and evidence
Independent test: draft create/edit/reload stays invisible to public readers.
- [x] T008 [US2] Add draft constraints/deduplication/translation-staleness/slug tests in tests/integration/drafts.test.mjs and tests/unit/admin.test.ts before service implementation.
- [x] T009 [US2] Implement app/translation/listing/support/source/evidence/feature editing in src/lib/admin/; name/developer 1..200, aliases <=50 each 1..100, summary/reason/quote <=4000, title <=500, versions <=100, release notes <=20000, feature description <=1000; official confirmation is explicit; unknown category stays null in drafts.
- [x] T010 [US2] Build app list/create/edit forms in src/app/[locale]/admin/apps/ and src/messages/{ko,en}.json with field errors, optimistic revision conflict, evidence links, two-language summary and translation states.
## Phase 5: US3 — Publish and correct
Independent test: successful publication versus invalid evidence/stale revision/failure injection.
- [x] T011 [US3] Write atomic rollback, evidence completeness, immutable history and archive/re-publish tests in tests/integration/publication.test.mjs.
- [x] T012 [US3] Add validated atomic publication/archive SQL in db/migrations/ and src/lib/admin/; derive actual reviewed_at from explicit action, require public reason 1..4000, lock revisions, preserve prior snapshots and never copy internal notes/actor into public records.
- [x] T013 [US3] Add review/publish/correct/archive UI and both-locale cache invalidation in src/app/[locale]/admin/apps/; preserve source review versus fetch dates.
## Phase 6: Polish and verification
- [x] T014 Add admin auth/error/mobile/keyboard/ko-en/light-dark E2E in tests/e2e/admin.spec.ts and production local-auth blocking tests in tests/unit/.
- [x] T015 Run all mandatory gates and actual PostgreSQL tests; record measured results, local-auth limits and bootstrap/run steps in docs/verification.md, docs/environments.md and README.md.

## Dependencies and execution
T001 → T002–T004 → US1 → US2 → US3 → verification. Tests precede implementation in each story. US1 policy tests and translated shell strings can be drafted independently; US2 schema tests and form layout can be inspected independently once contracts exist; US3 failure cases and review text are separate files. No concurrent edits to shared migration/messages files. This is sequencing guidance, not authorization to spawn implementation agents. First deliverable is private draft persistence; full requested scope still includes all stories and 003/004.

## Completion evidence

Local implementation and verification completed on 2026-10-29. See docs/verification.md, section “002·003·004 완료 감사”, for requirement-by-requirement evidence and explicit external launch boundaries. No external project or deployment was created.
