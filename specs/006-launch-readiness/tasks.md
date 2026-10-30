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
- [x] T012 [US3] Complete initial content publication under the latest owner decision: supported22 + qualified unknown106. T020 records live verification; permanent admin remains T011.
## Phase 6 — cross-cutting
- [x] T013 Run lint/typecheck/unit/DB/admin/fixture E2E/build/production guards and record actual results in docs/verification.md.
- [x] T014 Update README.md, .env.example, docs/assets.md, docs/environments.md and tasks with completed versus external-blocked items.

## Dependencies and execution
T001→T002→T003/T005. T004 depends on provider access; T006/T007 follow config contract; T008
requires hosted secrets and schema. T009/T010 can proceed independently from external provisioning.
T011 requires a permanent Production administrator; T012 is complete under the latest initial-publication decision. T013/T014
finish local work without relabeling blocked external tasks. Research was delegated per speckit-plan;
shared code edits and browser suites remain sequential. Tests for new contracts precede implementation.

Final architecture: local PostgreSQL/files + one hosted Supabase DB/Storage + Vercel Production. Preview environment variables removed. Existing project IDs/data retained; names changed to is-duo-ready. The actual application is deployed; T011 remains incomplete for permanent admin/authenticated browser checks; T012 content publication is now complete. The later T019 run passed default Turbopack builds locally and on Vercel; earlier T013 build restrictions remain historical evidence.

## Post-publication source maintenance — user request 2026-10-29
- [x] T015 Convert authored JavaScript to strict TypeScript, update command/preload entrypoints, and verify lint/types/unit/DB/browser/build behavior; detailed run outcomes remain in docs/verification.md.
- [x] T016 Exclude optional Spec Kit/agent tooling from Git, preserve authored principles/specifications, and document the existing PostgreSQL migration/function architecture without changing applied SQL.

## Official badge publication — user decision 2026-10-29
- [x] T017 Record approval to publish apps with directly verified official Made for iPhone Duo badges, without an additional per-app approval or device evaluation; distinguish badge observations from release notes and human review timestamps in docs/PRD.md and this feature spec.
- [ ] T018 Verify app-specific official badges and KR availability, record source/wording/observation provenance, complete required content, publish eligible apps through the existing publication flow and verify public records. Initial VLLO/Timepage web checks did not establish badge presence; the existing 22 release-note candidates are not a verified badge list. Application deployment is complete under T019; This badge investigation is optional after the latest owner decision; T020 publishes the initial wording-based and qualified-unknown batch.

## Vercel connection — user request 2026-10-29
- [x] T019 Deploy a fixed source snapshot to the existing Production project, verify GitHub/main connection and live domain, repair upload dependency exclusions, and verify public pages, anonymous admin denial, development asset denial and noindex. Keep unpublished app data private and record source provenance and remaining content/admin work in docs/release.md and docs/verification.md.

- [x] T020 Publish the initial 128 apps under the latest owner decision, verify anonymous supported/unverified counts, filters, detail evidence and icons on the deployed site.

## 공유 미리보기·SEO — 사용자 요청 2026-10-29
- [x] T021 한 파일 SEO 설정·메타데이터 helper·페이지별 제목/설명/canonical/hreflang/OG/Twitter·홈 WebSite 구조화 데이터를 구현한다.
- [x] T022 한국어/영어 1200×630 자체 브랜드 공유 이미지를 구현하고 로컬 글꼴 출처를 기록한다.
- [x] T023 검색 색인 opt-in을 보존하며 실제 운영 소셜 봇 접근·사이트맵 언어 대체 URL·초기 HTML head 메타데이터를 정리한다.
- [x] T024 단위/raw HTML/PNG 검증과 저장소 필수 검사를 수행하고 SEO 관리 문서·검증 기록을 남긴다.

## CI failure and duration — 2026-10-30

- [x] T029 GitHub Actions 실패 단계·시간을 조사하고 정적/공개/관리자 shard/운영 검증을 분리한다. 기존 verify 필수 검사 이름과 모든 게이트를 유지하며 실패 trace를 업로드한다.
- [x] T030 아이콘 카드 활성화 및 가져오기 이동/접근성 대기를 보완하고 관리자 42개·공개 32개·대상 5개 재실행·실제 shard 3+2개, lint/types/unit89/DB16/Webpack·운영 경계를 검증했다. 기본 Turbopack의 기존 EPERM 및 원격 미실행을 docs/verification.md에 구분했다.
- [ ] T031 필요한 기존 로컬 수정과 CI 변경의 원격 반영 후 GitHub CI 전체 통과 및 실제 소요 시간을 확인한다. 이번 조사에서는 commit/push·원격 재실행을 하지 않았다.

- [x] T032 CI 반영 후 trace로 남은 탐색 실패를 분리하고, Canvas를 첫 DOM commit 이후 프레임에 마운트한다. 임시 3D 제거/준비 상태 대기/번들러 비교와 Turbopack 탐색 10회·격리 관리자 10개 검증을 기록했다. 실제 원격 최종 통과는 T031에서 추적한다.

- [x] T033 한 프레임 지연만으로 원격 CI가 해결되지 않음을 기록하고, Canvas의 자동 context/Activity bridge를 App Router에서 분리한 client-only React root로 격리했다. props 갱신·취소·unmount 정리와 lint/types/unit89/공개32/격리 관리자10개를 검증했다. 원격 최종 통과는 T031에서 계속 추적한다.

- [x] T034 원격에서 입증되지 않은 3D root 변경을 원복했다. 숨겨진 Activity를 제외한 실제 기기 준비 대기, 옵션을 열기 전 즉시 중앙 스크롤, locale 문서 교체와 URL·쿠키·키보드 보존을 구현·검증했다. 공개32/관리자42/locale9회/history3회 통과와 앞선 실패를 기록했다. 원격 전체 통과는 T031에서 추적한다.
