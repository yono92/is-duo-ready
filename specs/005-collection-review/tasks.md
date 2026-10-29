# Tasks: 005 변경 수집·검토·제보

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/workflow.md
**Tests**: Required by specification SC-001..005 and repository gates.

## Phase 1 — Setup
- [x] T001 Complete specification/design/checklist in specs/005-collection-review/ and verify existing ignore/config boundaries.

## Phase 2 — Foundation
- [x] T002 Add real DB workflow/security tests in tests/integration/operations.test.ts for candidate deduplication, rate limiting, atomic approval and role isolation.
- [x] T003 Add db/migrations/004_collection_review.sql with RLS and constrained entities: target interval_hours 24..168, URL <=2000, approval_note 1..1000; payload object <=150000 bytes; review states pending/deferred/approved/rejected and positive revision; submission body 10..4000; attempts 0..3; SHA256 fingerprints unique across terminal states.

## Phase 3 — US1 collection (P1)
Independent test: repeated content generates one candidate, failures preserve success/public data, lease recovery and forbidden hosts fail closed.
- [x] T004 [P] [US1] Add adapter boundary tests in tests/unit/collection.test.ts for DNS, redirects, robots, body/time bounds and fingerprint behavior.
- [x] T005 [US1] Implement src/lib/collection/web.ts with approved exact host, pinned public IPv4, 8s abort, <=2MiB response, robots checks and <=2 retries.
- [x] T006 [US1] Implement src/lib/collection/worker.ts and scripts/collect.ts with committed 5-minute lease, one target/request, <=5 targets/batch, attempts and backoff; share import lock/clock; local-only watch.
- [x] T007 [US1] Implement src/app/[locale]/admin/(protected)/collections/page.tsx and localized forms with explicit official/terms confirmation, pause/retry/status.

## Phase 4 — US2 review (P1)
Independent test: approval updates publication+queue together, failed validation/stale revisions roll back, defer/reject leave public unchanged.
- [x] T008 [US2] Implement src/lib/operations/repository.ts and admin operations actions with per-action admin assertion, review/app revision checks, required reason <=4000 and publish cache invalidation.
- [x] T009 [US2] Implement src/app/[locale]/admin/(protected)/reviews/ and src/components/operations/ comparison/forms, existing editor links, filters/page size 30 and all decision states.

## Phase 5 — US3 submission (P2)
Independent test: anonymous receipt exposes no private data, admin can link only matching app ID, request caps remain atomic under concurrent connections.
- [x] T010 [US3] Implement src/lib/operations/input.ts and src/app/[locale]/submit/actions.ts with fixed-field validation, opaque visitor cookie, honeypot, private ingress and generic results.
- [x] T011 [US3] Implement src/app/[locale]/submit/page.tsx and admin submissions list/detail integration with published-only prefill and matching app link.

## Phase 6 — Cross-cutting verification
- [x] T012 Add tests/e2e/operations.spec.ts for full collection→review and submission flows, denied/replayed actions, ko/en themes widths, keyboard and axe; repeat core scenarios five times.
- [x] T013 Run lint/typecheck/unit/real DB/admin E2E/fixture E2E/production build and production guards; fix failures in affected files.
- [x] T014 Record actual results and remaining hosted setup in docs/verification.md, docs/environments.md, README.md and align specs/005-collection-review/tasks.md.

## Dependencies and parallel opportunities
T001→T002→T003; US1 T004→T005→T006→T007; US2 T008→T009; US3 T010→T011; then T012→T013→T014.
After foundation, adapter unit tests and review repository may be prepared independently; UI/message dictionary edits are sequential.
US3 input tests may run alongside US1 unit tests. Browser suites share .next-test and must run sequentially.

## Implementation strategy
Deliver and verify US1 collection first, then transactional review, then intake. All three are requested; MVP is a checkpoint, not a stopping point.

## Completion
2026-10-29: 14/14 complete for local implementation and verification. See docs/verification.md for actual commands, counts, failure corrections and remaining 006 hosted/scheduler setup. No real submissions, monitored targets or public approvals were created in the main DB.

## TanStack Query 도입 — 2026-10-29

- [x] T015 정확한 의존성 버전, 화면별 QueryClient, 인증된 수집 현황 GET 및 15초 갱신/오류 UI를 구현한다.
- [x] T016 수집 화면 액션 완료 후 캐시 무효화를 연결하고 API 권한·자동 갱신·일시 장애 복구·권한 회수 회귀 테스트를 추가한다.
- [x] T017 lint/typecheck/unit/fixture E2E/관리자 E2E/build를 실행하고 실제 결과와 상태 관리 기준을 기록한다.
