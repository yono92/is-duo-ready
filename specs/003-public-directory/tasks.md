# Tasks: 003-public-directory

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/workflow.md.
**Tests**: Required by repository constitution/PRD.

## Phase 1: Setup
- [x] T001 Create validated spec/design/contracts in specs/003-public-directory/ and map existing fixture query contracts.
## Phase 2: Foundation
- [x] T002 Add explicit source mode and fictional/real DTO types in src/lib/data/directory.ts, src/lib/directory/types.ts; preserve fixture gate and fail on DB errors without fallback.
## Phase 3: US1 — Real public directory
Independent test: only published rows visible across search/filter/sort/pages in either locale.
- [x] T003 [US1] Write non-owner public query/search/pagination/error tests in tests/integration/directory.test.ts; enforce q<=100, page<=10000 and 24 rows per page.
- [x] T004 [US1] Implement PostgreSQL public query adapter and SSR listing in src/lib/data/, src/app/[locale]/page.tsx; deterministic tie-breaking and error/empty/unavailable states.
## Phase 4: US2 — Detail and sources
Independent test: actual reviewed evidence/versions versus null fields, stale translations and hidden/old slugs.
- [x] T005 [US2] Add actual-data detail, private-field exclusion, hidden slug and alias redirect tests in tests/e2e/public-data.spec.ts.
- [x] T006 [US2] Implement real detail/evidence/features/history and safe old-slug redirects in src/app/[locale]/apps/[slug]/page.tsx, src/messages/{ko,en}.json; preserve KR and source fallback.
## Phase 5: US3 — Recent changes
Independent test: publication updates both locales; metadata-only imports do not create support updates.
- [x] T007 [US3] Implement paginated updates in src/app/[locale]/updates/page.tsx with public history queries in src/lib/data/ and localized content.
- [x] T008 [US3] Wire post-commit invalidation and add cache-refresh/archive integration tests in tests/e2e/public-data.spec.ts.
## Phase 6: Polish and verification
- [x] T009 Add gated published-only sitemap/metadata/robots in src/app/; local/preview noindex and no fixture URL leakage.
- [x] T010 Verify 001 regression plus real-data flows across locales/themes/viewport widths; required gates and honest results in docs/verification.md and README.md.

## Dependencies and execution
002 public projection → T002 → US1 → US2 → US3 → SEO/regression. Tests before each implementation. US1 query tests and mode documentation, US2 source strings and privacy tests, US3 updates strings and invalidation tests are independently reviewable; shared files are edited sequentially. Do not stop after a fixture-only pass.

## Completion evidence

Local implementation and verification completed on 2026-10-29. See docs/verification.md, section “002·003·004 완료 감사”, for requirement-by-requirement evidence and explicit external launch boundaries. No external project or deployment was created.
