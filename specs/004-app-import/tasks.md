# Tasks: 004-app-import

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/workflow.md.
**Tests**: Required by repository constitution/PRD.

## Phase 1: Setup
- [x] T001 Create validated spec/design/contracts in specs/004-app-import/ with official Apple API documentation and exact KR/no-auto-support boundary.
## Phase 2: Foundation
- [x] T002 Add private import_runs/import_rows migrations in db/migrations/; run+row unique, app/evidence deduplication and administrator-only policies.
## Phase 3: US1 — URL import
Independent test: successful KR lookup versus no result, timeout, malformed/oversized response and rate limits.
- [x] T003 [US1] Write URL parsing/response normalization/network-failure tests in tests/unit/import.test.ts; fetch only fixed itunes.apple.com lookup, reject redirects and arbitrary URLs.
- [x] T004 [US1] Implement bounded Apple lookup in src/lib/import/apple.ts; >=3-second live spacing, timeout, <=2 retries, safe Retry-After cap, no silent country fallback and no fabricated missing fields.
## Phase 4: US2 — CSV and proposals
Independent test: repeat mixed valid/invalid CSV twice and retain zero duplicate apps/evidence or auto-publications.
- [x] T005 [US2] Write CSV parsing/idempotency/published-state preservation tests in tests/unit/import.test.ts and tests/integration/import.test.ts; 512 KiB, 200 rows, BOM/CRLF/quoted newline/escaped quote and duplicate-header cases.
- [x] T006 [US2] Implement CSV parser and resumable import batches <=10 rows in src/lib/import/; match app_store_id, preserve reviewed snapshots, keep source/status proposals private, unmapped category null until classified.
- [x] T007 [US2] Build localized URL/CSV input, progress and row-result/retry UI in src/app/[locale]/admin/apps/import/ and src/messages/{ko,en}.json.
## Phase 5: US3 — Import through publication
Independent test: imported draft → human evidence review → public search/detail in both languages.
- [x] T008 [US3] Add authorized import-to-review-to-public E2E in tests/e2e/import.spec.ts with separate deterministic test data and no real fake evidence.
- [x] T009 [US3] Implement read-only approximately-ten-real-app KR probe in scripts/probe-app-store.ts; record observed fields/missing data/errors/source time and asset terms in docs/import-validation.md and docs/assets.md without publishing support claims.
## Phase 6: Polish and verification
- [x] T010 Run mandatory gates plus live probe and idempotency/privacy/failure tests; document results, remaining real-app research/100-app launch target and external environment checks in docs/verification.md and README.md.

## Dependencies and execution
002/003 complete core contracts → import foundation → US1 → US2 → US3 → verification. Test parser/network behavior before mutations. US1 fixtures and probe research, US2 CSV tests and translated form strings, US3 E2E assertions and data-report drafting can proceed independently; shared services/messages and final checks remain sequential. No automatic support approval or uncontrolled source fetching is included; scheduler/queue/submissions remain 005.

## Completion evidence

## Initial content follow-up — 2026-10-29

- [x] T015 Add local icon file storage, bounded source collection, metadata migration and RLS.
- [x] T016 Integrate imports, provide a repeatable sync command and backfill actual icons. Stored 128 original JPEG files (4,105,819 bytes); repeat sync verified and skipped all 128.
- [x] T017 Render local icons with fallback and App Store badge in public/admin views.
- [x] T018 Verify source validation, refresh preservation, RLS, browser behavior and required gates; record asset provenance and operational limits. See docs/verification.md, local icon section, including observed test failures and reruns. Hosted storage remains future work.

- [x] T011 Define the user-requested initial content scope and official discovery sources in docs/initial-data.md.
- [x] T012 Import actual KR metadata for official collection candidates through the existing RLS-protected import function; retain sources and per-row outcomes. 133 candidates, 128 imported drafts, 5 KR not-found results.
- [x] T013 Verify counts, duplicate prevention, review/publication boundary and administrator visibility; record actual results in docs/initial-data.md and docs/verification.md. 128/128 repeat imports duplicate; no public entries or human review timestamps.
- [ ] T014 Review app-specific support evidence and obtain explicit publication approval before publishing initial content. 22 source-backed bilingual drafts prepared; human publication approval pending.

Local implementation and verification completed on 2026-10-29. See docs/verification.md, section “002·003·004 완료 감사”, for requirement-by-requirement evidence and explicit external launch boundaries. No external project or deployment was created.
