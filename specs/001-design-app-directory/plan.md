# Implementation Plan: 001 디자인 기반·테마·다국어·앱 탐색

**Branch**: main (local) | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)
**Input**: specs/001-design-app-directory/spec.md

## Summary
사용자의 품질 개선 지시에 따라 CSS 모형을 Three.js 0.186.1, React Three Fiber 9.8.2, Drei 10.7.9 기반 WebGL 모형으로 교체한다. 클라이언트에서 지연 로드하고 둥근 베벨·금속·유리·카메라·커버 화면·힌지를 실제 기하로 구성한다. 자체 생성한 사막 WebP 텍스처와 로컬 Lightformer 환경광을 사용하며 외부 CDN 모델/HDR 요청은 없다. 가장자리 직접 조작 핸들과 독립 Astryx 초기화 버튼, 포인터 캡처 및 키보드 조작을 제공한다. demand 렌더링, DPR 상한 2, reduced motion, WebGL 실패 시 기존 이미지 대체를 제공한다. 기존 deviceAsset 게이트 안에서만 렌더링하고 실제 캔버스 픽셀 변화·터치·접근성·컨텍스트 손실을 검증한다.

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

전 화면 문구 검토(2026-10-29): 18개 namespace의 한국어·영어 420개씩을 소비 화면·동작과 함께 검토한다. 가상 앱 30개의 양 언어 설명과 접근성 라벨도 확인한다. messages를 단일 UI 문구 출처로 유지하고, 전용 페이지가 대체한 Info placeholder와 상세의 반복 소개를 제거한다. 가져오기 안내는 기존 pending/remaining 값으로 분기하며 데이터·인증·공개 정책은 변경하지 않는다. 기존 공개/관리자 E2E 기대 문구를 갱신하고 필수 검사·실제 화면을 확인한다.

공개 문구 정리(2026-10-29): ko/en 메시지에서 홈·지원 안내·푸터·메타데이터를 수정한다. 홈의 중복 소개와 푸터 슬로건을 제거하고, 지원 안내는 기존 상태 상수를 사용하는 정의 목록과 출처·갱신·스토어 안내로 구성한다. 라우팅·데이터·판정 로직은 유지하며 기존 탐색 E2E의 변경된 접근 가능 이름을 갱신한다. 필수 검사와 양 언어 화면 확인 결과를 검증 기록에 남긴다.

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

## 전체 Astryx 전환 — 2026-10-29 후속 지시
이전 시각 지침보다 사용자 후속 지시를 우선한다. 공개/관리자 입력·선택·체크·날짜·파일·탐색·카드·알림을 실제 Astryx 컴포넌트로 교체하고 Neutral 기본 테마를 사용한다. 기존 Apple 색상·pill 입력·커스텀 스위치와 native select/textarea 보존 계획은 폐기한다. 데이터·URL·서버 액션 계약은 유지하며 DESIGN.md 및 T039–T041을 따른다.

## Fold screen transition — 2026-10-29
현재 WebGL MeshBasicMaterial의 map 샘플만 9-tap Gaussian 커널로 확장한다. 패널과 커버 화면이 공유하는 uniform을 실제 힌지 각속도에 따라 갱신하고 감쇠 후 0으로 고정한다. 전체 이미지 UV로 샘플링해 중앙 이음새를 유지하고 기존 sRGB 경로를 보존한다. 블러가 사라질 때까지 demand 렌더링을 유지하며 reduced motion/최초 프레임은 블러 0이다. 새 의존성·이미지 자산은 추가하지 않는다.

## Apple 시각 기준 복원 및 모션 — 2026-10-29
사용자의 최신 지시: 디자인은 Apple 참고, 컴포넌트는 Meta Astryx다. Neutral-only 시각 지침은 철회하고 중앙 apple-theme.css에서 실제 Astryx의 공개 토큰을 제품 색·타이포·모서리에 연결한다. 한 줄 데스크톱 헤더, 분명한 hero·탐색 동작, 표면이 구분되는 카드와 절제된 등장·hover 모션을 적용한다. ko/en·테마·URL·키보드·reduced motion과 실제/가상 데이터 경계는 보존한다. DESIGN.md와 T045–T046을 따른다.

## Direct device manipulation — 2026-10-29
WebGL 애니메이션의 실제 패널 바깥쪽 좌표를 DOM 핸들로 투영한다. 프레임별 DOM ref 갱신으로 React 재렌더를 피하고, 닫혀 겹칠 때는 두 hit target을 최소 48px 떨어뜨린다. 포인터 시작 시 투영된 바깥 방향과 각도를 고정하고 포인터 캡처로 회전과 접힘을 분리한다. 전용 3D 가장자리 hit target은 role=slider, 방향키 및 Home/End를 지원한다. 초기화는 Astryx Button을 유지한다. 회전 영역의 세로 delta 부호를 고치고 touch-action:none으로 양축 터치 조작을 제공한다. 주변 페이지 스크롤은 유지한다.

손잡이 표시 제거: GripVertical 및 pill 배경 CSS만 제거한다. 기존 투영 좌표와 44×64px hit target,
포인터 이벤트, role=slider, 전역 :focus-visible 스타일을 유지한다.
