# Tasks: 001 디자인 기반·테마·다국어·앱 탐색

## Phase 1: Setup
- [x] T001 Initialize Next.js, pinned dependencies and scripts in package.json, tsconfig.json, next.config.ts.
- [x] T002 Record project instructions and Spec Kit workflow in AGENTS.md and README.md.

## Phase 2: Foundation
- [x] T003 Define model and URL parser in src/lib/directory/{types,query}.ts; q max 100 chars, page positive integer ≤10000, page size 24.
- [x] T004 Add 30 fictional apps and publication/environment gates in src/lib/data/; KR literal, nullable UTC review timestamps, empty evidence.
- [x] T005 Add tokens, shadcn primitives and recorded placeholder in src/app/globals.css, src/components/ui/, public/device-placeholder.svg, docs/assets.md.

## Phase 3: US1 — Directory
Independent test: multilingual aliases + compound filters + pagination + history match URL.
- [x] T006 [US1] Implement SSR listing and linked cards in src/app/[locale]/page.tsx, src/components/directory/.
- [x] T007 [US1] Implement URL-driven search, categories, statuses, sorting, pagination and reset in src/components/directory/controls.tsx.
- [x] T008 [US1] Implement fixture detail and scoped information routes in src/app/[locale]/apps/[slug]/page.tsx and src/app/[locale]/[section]/page.tsx.
- [x] T009 [US1] Test query normalization, filters, order and draft exclusion in tests/unit/directory.test.ts.

## Phase 4: US2 — Localization
Independent test: direct locale, root negotiation, locale switch retains query/slug and KR.
- [x] T010 [US2] Configure next-intl routing/request/navigation and proxy in src/i18n/, src/proxy.ts.
- [x] T011 [US2] Add complete ICU dictionaries and translated layout/metadata in src/messages/, src/app/[locale]/layout.tsx.
- [x] T012 [US2] Implement locale switching and original-content fallback in src/components/preferences.tsx, src/lib/directory/content.ts.
- [x] T013 [US2] Test dictionary parity and missing/stale content fallback in tests/unit/i18n.test.ts.

## Phase 5: US3 — Theme and mobile
Independent test: initial system default follows OS; manual light/dark choice persists and ignores OS; Sheet focus and reset work.
- [x] T014 [US3] Add ThemeProvider and persistent accessible theme selector in src/components/providers.tsx and src/components/preferences.tsx.
- [x] T015 [US3] Add responsive Sheet, active count and keyboard controls in src/components/directory/controls.tsx.
- [x] T016 [US3] Verify responsive layouts, theme and accessibility in tests/e2e/directory.spec.ts.

## Phase 6: US4 — Trust and boundaries
Independent test: fixture unmistakable locally and absent in deployment; no invented evidence or asset permissions.
- [x] T017 [US4] Add unavailable/error/404 states, fixture notices and noindex sitemap/robots in src/app/.
- [x] T018 [US4] Add server-only Supabase configuration boundary and names-only env example in src/lib/supabase/server.ts, .env.example.
- [x] T019 [US4] Test production fixture blocking and evidence invariants in tests/unit/policy.test.ts.

## Phase 7: Polish and verification
- [x] T020 Run lint, typecheck, unit/E2E/a11y, build; record actual results in docs/verification.md.
- [x] T021 Document run commands, external setup, final asset and deferred features in README.md.

## Phase 8: User-selected Apple design reference
- [x] T022 Record source/license and project adaptations in DESIGN.md, docs/references/, docs/PRD.md and specs/001-design-app-directory/{spec,plan,research}.md; link from README.md.
- [x] T023 [US3] Apply the initial Apple-inspired neutral/blue tokens, compact hero, directory controls and two-line card summaries in src/app/globals.css and src/components/; add Globe preferences and original matching logo/favicon in public/brand/duo-mark.svg and src/app/icon.svg. Later layout and theme-control changes are tracked in T026–T027.
- [x] T024 [US3] Verify the initial Globe menu keyboard/locale behavior, theme persistence/OS response, logo/favicon delivery, both languages/themes, 360/768/1440px layouts, above-fold directory access and existing tests; record actual results in docs/verification.md. T027 verifies the later layout and single-switch revision.

## Phase 9: User-requested 3D-style device visual
- [x] T025 [US3] Connect the newly generated reference-informed AI device render in public/device/iphone-duo-render.png and src/lib/device-asset.ts; record metadata/source/generation details in docs/assets.md, provide localized AI-render/example-screen caption and alt text in src/messages/, and verify both themes and responsive layout before recording results in docs/verification.md. Completed for local preview; public-use rights are not cleared.

## Phase 10: Directory layout revision after user review
- [x] T026 [US3] Set common width to 1120px, balance the desktop 42px hero copy/device at 1.15:0.85, center the mobile 28–30px heading/150px device, align search/sort and cards beside the 168px category/status sidebar, and use 20px card padding/gaps with 14px varied explicitly fictional summaries. Replace theme controls with a single accessible light/dark switch: initial OS default, persistent manual choice, no OS following after manual selection and no explicit system UI. Preserve palette, Globe locale menu and mobile Sheet.
- [x] T027 [US3] Inspect actual desktop/mobile light/dark screens and above-fold access, verify single-switch semantics/keyboard behavior, initial OS following and manual persistence/OS independence, run required regression checks, update design/spec records, and explain the working local URL and remaining data/asset setup.
- [x] T028 [US1] Replace the custom four-category set with the nine official Apple category names in docs/references/app-store-categories.md; update types, localized messages and explicit fictional fixture categories. Normalize legacy creativity URLs to graphics-design, document that slugs are internal and the list is a subset, and verify category filtering, locale independence and URL compatibility without changing evidence or review timestamps.

## Phase 11: US5 — Local tooling for PRD 002/006 preparation
Historical implementation: this Supabase/native setup was verified at the time. Phase 12 supersedes its local runtime and current setup instructions while preserving this completion record.
Independent test: start the local stack, generate safe ignored environment values, distinguish config validation from connectivity, reject invalid deployment settings, and preserve fixture behavior. No external projects or deployment.
- [x] T029 [US5] Pin Supabase CLI 2.122.0 in package.json/package-lock.json and Node 22.14.0 in .nvmrc; add supabase/config.toml, review supabase/supabase.lock, and provide db:start/db:stop/db:status scripts. Start and inspect duo-ready's current repository/branch stack with Postgres 17, ports 55321–55324 and experimental native runtime after the Docker disk failure. Preserve existing volumes, disable unused services/signup/table auto-exposure, add no application tables or seeds, and document experimental/runtime limits.
- [x] T030 [US5] Implement db:env safe .env.local generation (0600; refuse existing files), target-aware env:check and local-only read-only db:check in scripts/; update .env.example and ignore rules. Write only required public local values and never log private keys or credentials.
- [x] T031 [US5] Add vercel.json to run env:check before build; reject invalid Preview/Production settings, including missing production project reference or mismatched environment project, while preserving the runtime fixture gate. Verify valid/invalid cases locally without linking or deploying.
- [x] T032 [US5] Apply the requested localized public copy in src/messages/{ko,en}.json, finalize docs/environments.md and README.md with verified commands and external setup boundaries, run local smoke plus required regression checks, and record actual outcomes in docs/verification.md before marking this slice complete.

## Phase 12: US5 — Standalone local PostgreSQL
Independent test: run only PostgreSQL through Compose, preserve its volume across stop/start, connect with a server-only loopback DATABASE_URL and a real read-only SELECT, retain hosted environment guards, and verify scoped image cleanup. No 002 application schema or external deployment.
- [x] T033 [US5] Add compose.yaml with a pinned PostgreSQL 17 image, local duo_ready database, 127.0.0.1:55322 and a dedicated persistent volume; replace db:start/db:stop/db:status in package.json and scripts/. Remove the Supabase CLI devDependency and local supabase/config.toml/supabase.lock while retaining the hosted Supabase client boundary.
- [x] T034 [US5] Change scripts/, .env.example and environment tests to generate a protected server-only DATABASE_URL, preserve existing user settings, validate optional local PostgreSQL configuration, and run a real read-only SELECT via db:check. Preserve Preview/Production Supabase project separation and the Vercel build/runtime fixture guards.
- [x] T035 [US5] Verify PostgreSQL start/stop/restart and data retention, safe environment migration and SQL smoke; inspect usage and remove only this work's downloaded Supabase Docker images without touching unrelated resources or data volumes. Finalize docs/environments.md and README.md, run required checks, and append actual results to docs/verification.md before completion.

## Dependencies and execution strategy
T001–T005 foundation → US1 + US2 → US3 → US4 → verification. US1 is minimum directory slice;
all four stories are required for 001 delivery. UI tests begin after locale layout exists.
Independent work examples: US1 query tests vs cards, US2 dictionary parity vs metadata,
US3 responsive checks vs theme test cases, US4 asset audit vs policy tests. No shared-file parallel edits.
35 tasks: original setup 2, foundation 3, US1 4, US2 4, US3 3, US4 3, polish 2; visual refinement 3; device visual 1; layout/theme/category follow-up 3; local tooling/copy follow-up 4; standalone PostgreSQL transition 3.
Visual refinement dependencies: T022 documentation → T023 styles → T024 verification.
Device visual follow-up: T025 asset/source/localization → responsive/theme verification completed locally; public-use rights review remains a launch prerequisite.
Latest revision: T026 layout/theme and T028 category changes → T027 combined regression and visual verification. T026–T028 completed locally: lint, typecheck, 11 unit tests, formatting and 15 E2E tests passed; after final Korean keep-all styling, 4 responsive checks and production build passed. Final records are in docs/verification.md; public-use asset rights remain unresolved.

Local tooling dependencies: T029 CLI/config → T030 environment and connectivity → T031 build guard → T032 documented verification. Documentation drafting can run alongside implementation; final commands and completion require observed results. T029–T032 are locally verified: native startup/restart, protected environment generation, Auth/REST smoke, invalid hosted configuration rejection, 18 unit tests, 15 E2E tests, build and three production fixture scenarios passed. This prepares PRD 002/006 without implementing their product features; see docs/verification.md.

Current transition: T033 Compose/runtime replacement → T034 environment and SQL checks → T035 scoped cleanup and verification. T033–T035 are locally verified: scoped image cleanup, healthy PostgreSQL, protected environment migration, SQL smoke and actual row persistence across stop/start passed; lint/typecheck/format, 20 unit tests, 15 E2E tests, build and three production fixture checks passed. Earlier Supabase results remain historical; current results are in docs/verification.md.

## Phase 13: User-approved Astryx migration
- [x] T036 Replace shadcn/Radix UI primitives and language menu with Astryx 0.7.4, preserve native form submission, URL state, locale and keyboard interaction; remove unused dependencies/config.
- [x] T037 Integrate built Astryx theme/CSS with Tailwind 4 and existing persisted theme choice; preserve Apple-inspired tokens, system typography, responsive directory and accessible mobile filters. Align PRD/design/constitution/plan.
- [x] T038 Verify lint, typecheck, unit tests, browser flows/accessibility/screenshots, production build and fixture gate; record actual outcomes in docs/verification.md.

T036–T038 complete: 52 unit tests, 15 directory E2E tests and 30 admin/import/operations E2E tests passed across scoped runs. Lint, typecheck, formatting, build and three production fixture scenarios passed. See docs/verification.md for initial failures, fixes, remaining build/dev warnings and browser coverage.
