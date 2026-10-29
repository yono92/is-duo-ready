# Implementation Plan: 001 디자인 기반·테마·다국어·앱 탐색

**Branch**: main (local) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)
**Input**: specs/001-design-app-directory/spec.md

## Summary
Next.js 서버 렌더링 목록과 URL 기반 클라이언트 제어를 결합한다. 30개 가상 fixture로
검색·정렬·페이지·상세 이동을 확인한다. next-intl로 언어, next-themes로 테마를 관리한다.
Supabase는 서버 전용 연결 경계와 환경 변수 계약만 준비하며 실제 조회는 003에서 구현한다.

## Visual Refinement — 2026-10-29

사용자 지정 Apple 디자인 분석의 프로젝트 적용 규칙을 `DESIGN.md`에 기록한다. 원문은
`docs/references/apple-design-analysis.md`에 MIT 라이선스와 함께 보존한다. Notion 참고는 탐색 구조에
유지한다. `src/app/globals.css`의 의미 토큰과 공통 컴포넌트 표현을 변경하되 URL·locale·데이터 로직은
변경하지 않는다. 시스템 글꼴, 중성 표면, Action Blue, 18px 모서리/20px 내부 간격의 utility 카드, pill 검색·버튼을 적용한다.
다크 utility 표면은 원문의 공백을 프로젝트에서 보완한다. 검정 compact header, white hero와
`#f5f5f7` 목록 바탕, 다크 hero `#000000`·목록 `#161617`·카드 `#272729`를 사용한다. 다크 링크
`#2997ff`와 흰 글자 CTA의 바탕 `#0066cc`를 분리한다. 일반 본문 17px와 별개로 카드 요약은 14px·
최대 두 줄이며 카드 간격은 20px이다. 카드 머리의 아이콘·이름은 가로로 배치하고 배지·카테고리 행과
검토일 footer를 둔다. 작은 기기 자산 영역을 유지하고 hero는 원문의 56px 대신 데스크톱 42px·
모바일 28~30px와 한국어 keep-all로 조정한다. 첫 화면의 검색·카드 일부가 유지되도록
hero 높이를 제한하며, 공식 이미지·글꼴 파일을 새로 포함하지 않는다. 타입·린트·기존 E2E 및 접근성,
화면 캡처와 production 빌드로 회귀를 확인한다.

헤더는 Globe 아이콘 dropdown(열 때만 한국어/English 표시)과 단일 라이트/다크 `role="switch"`를 둔다.
첫 방문은 시스템과 OS 변경을 자동으로 따르고, 수동 선택 후에는 저장한 선택을 유지하며 OS를 따르지 않는다.
`aria-checked`로 현재 다크 상태를 전달하고 별도 시스템 선택 UI는 제공하지 않는다. locale 저장·URL 전환은 유지한다.
검색·정렬은 오른쪽 카드 열에 맞추고 카테고리·상태는 왼쪽 사이드바에 모은다.
CSS 두 선 로고는 `public/brand/duo-mark.svg`의 자체 제작 파란 사각 듀얼 패널·체크 도안으로 바꾸고
동일 SVG를 `src/app/icon.svg`에 두어 favicon을 제공한다. 공식 자산은 추가하지 않는다.

## Technical Context

### Latest layout revision — user review
Keep the approved palette and local reference-informed render. Narrow the common content width to
1120px and balance hero copy/device at a 1.15:0.85 grid ratio with a 42px heading. On desktop, the
168px category/status sidebar starts beside the search toolbar; search and cards share their left edge.
Sorting sits beside search, with a compact results row below. Mobile retains the filter Sheet and a
centered stacked hero with a 28–30px heading and 150px device area. Cards use 20px padding/gaps and
14px short, distinct fictional summaries. The theme switch follows the initial system/manual contract above.

### Official category names
Use the nine official Apple category names documented in `docs/references/app-store-categories.md`,
with project-owned URL slugs. This is a subset for current fixtures, not the full App Store taxonomy
or Apple API identifiers. Normalize legacy `creativity` queries to `graphics-design` and serialize the
canonical slug. Keep translated labels in messages; future real KR App Store data must preserve its
primary genre identifier/name and use a verified mapping. Category changes do not change support
evidence, null review timestamps or store country. Verify alias normalization and filter behavior.

**Language/Version**: TypeScript strict, Node.js 22.14+
**Primary Dependencies**: Next.js 16.4.3, React 19, Tailwind CSS 4, Astryx 0.7.4, next-intl 4.14.9, next-themes
**Storage**: server-only fixture, theme localStorage, locale cookie; future Supabase Postgres/Auth
**Testing**: Vitest, Playwright Chromium, axe-core; tsc, ESLint, next build
**Target Platform**: modern browsers, future Vercel; local-only delivery now
**Project Type**: single Next.js web app
**Performance Goals**: no external requests for directory rendering; reserved image dimensions; 24 cards/page
**Constraints**: no credentials required; no official imagery; no fake evidence; fixture blocked on Vercel and normal production
**Scale/Scope**: 30 fictional apps, nine category names, two locales, light/dark switch with initial system default, 001 only

## Constitution Check

Before research: PASS — fictional fixtures carry no evidence, no external writes, no DB mutation.
After design: PASS — country independent of locale, production gate, nullable review date, non-indexable fixtures,
accessible controls, URL contract, tests for boundaries. No exception required.

## Project Structure

```text
specs/001-design-app-directory/{spec,plan,research,data-model,quickstart,tasks}.md
specs/001-design-app-directory/contracts/directory.md
src/app/[locale]/                 # SSR home, layout, fixture detail and scoped info routes
src/components/{ui,directory}/    # Astryx adapters and product UI
src/i18n/                        # routing, request, navigation
src/messages/{ko,en}.json
src/lib/{directory,data,supabase}/
public/device-placeholder.svg
src/proxy.ts
 tests/unit/                     # query, policy, translations
 tests/e2e/                      # navigation, themes, a11y, responsive
```

**Structure Decision**: One app; pure directory operations reusable for later DB adapter. Client components
only for controls/theme. Actual data fetched server-side. No unused auth, schema, scheduler scaffolding.

## Complexity Tracking

No violations. The initial original schematic remains available as a fallback. Per the user's later
request, the active asset is a generated product render based on inspected official reference photos,
stored as public/device/iphone-duo-render.png (1536 × 1024 with alpha). The reference photos are not
bundled. Localized captions disclose AI rendering and example screen content; no app support is implied.
The render is a local prototype, not public-use rights clearance. Asset provenance, the prompt, and
Apple's relevant image-use policy are recorded in docs/assets.md and docs/references/duo-render-prompt.md.

## Current local tooling plan - standalone PostgreSQL for PRD 002/006

The user's later choice replaces the local Supabase runtime with one PostgreSQL service. T029-T032
and their successful Supabase/native checks remain historical evidence in docs/verification.md.
No new feature number is created: spec amendment -> this plan -> T033-T035 -> implementation ->
verification. Hosted Supabase/Vercel contracts remain; this slice does not implement the application
schema, RLS, administrator flows or real directory adapter from 002/003.

1. Add compose.yaml with postgres:17.11-bookworm pinned to digest
   sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5, database duo_ready, a dedicated
   volume and host binding 127.0.0.1:55322. The postgres account/password are local-only defaults,
   never hosted credentials. db:start runs docker compose up -d --wait; db:stop runs docker compose
   stop and preserves the volume. db:status reports the current Compose service state.
2. Remove the Supabase CLI devDependency and local supabase/config.toml/supabase.lock. Retain
   @supabase/supabase-js and the future hosted read boundary. Stop the previous local stack before
   changing the port owner. Inventory and remove only the Supabase Docker images downloaded for
   this work after checking usage; preserve unrelated images, containers and existing data volumes.
3. Generate server-only DATABASE_URL in ignored .env.local through db:env, preserving existing
   user settings and mode 0600. The existing Supabase-local file is migrated deliberately rather
   than blindly overwritten. db:check uses a real read-only PostgreSQL SELECT, not HTTP health.
   Local env:check accepts UI-only mode or a valid loopback DATABASE_URL; cloud targets continue
   to require Supabase URL/public key/site origin and separate Preview/Production project refs.
4. Keep vercel.json's environment guard and runtime fixture gate. Update docs/environments.md and
   README.md to the current PostgreSQL workflow, then verify start/stop/restart, SQL connectivity,
   environment safety, cleanup scope and required regressions before completing T033-T035.

**Runtime boundary**: local Auth, PostgREST and Studio are absent. PostgreSQL availability does not
implement Supabase Auth/RLS policies or real app publication. Local credentials never enter NEXT_PUBLIC_
variables. No app tables, migrations or seeds are added in this transition.
**Version contract**: compose.yaml pins PostgreSQL 17.11-bookworm and its digest; pg 8.23.1 is a
development dependency for SQL smoke. Node remains 22.x with .nvmrc 22.14.0. CLI-specific runtime/lock commands are no longer current guidance.
**Constitution check**: planned local-only scope preserves evidence, locale/country, fixture and
credential boundaries. Transition and scoped cleanup are verified, including SQL connectivity and actual row retention
across Compose stop/start. Required regressions passed; see docs/verification.md. External creation
and production deployment remain excluded.

## Astryx migration — 2026-10-29
User approved replacing shadcn/ui. Use pinned Astryx 0.7.4 and its precompiled CSS/built Neutral theme with local semantic token overrides. Keep Tailwind 4 for product layout and next-themes for persisted system/manual preference. Replace shared Button/Input/Badge/Skeleton plus Radix Sheet and language menu. Use explicit client boundaries for Astryx components; retain server data/routing/actions. Verify native validation/FormData, localized controls, modal focus/Escape/return, theme SSR/hydration and existing browser acceptance tests before completion. No deployment or data changes.
