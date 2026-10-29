# 001 검증 결과

## 2026-10-29 — Astryx 교체 완료 (T036–T038)

사용자 승인으로 shadcn/ui/Radix를 Astryx로 교체했다. `@astryxdesign/core` / `theme-neutral` 0.7.4, `@stylexjs/stylex` 0.19.1을 고정했다. 기존 Apple 스타일, 언어/URL/테마 동작과 데이터 경계를 유지한다.

| 명령 / 검사 | 실제 결과 |
| --- | --- |
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm test` | 15개 파일, 52개 테스트 통과 |
| `DUO_TEST_PORT=3353 npm run test:e2e` | 15개 통과: 검색/필터/페이지/언어/테마, 모바일 모달, 메타데이터 |
| 관리자 브라우저 검증 | 개별 실행 합계 30개 통과: admin 7개, import 17개, operations 5개, import-control 1개. `npm run test:admin -- ...`으로 매 실행 임시 DB 생성·정리 |
| axe 접근성 / 반응형 | 공개 ko/en × light/dark, 모바일 모달, 관리자 입력·CSV 가져오기·제보·검토 화면 통과. 360/768/1440px 넘침 검사 통과 |
| `npm run build` | 성공. 변경하지 않은 `src/lib/icons/storage.mjs`의 동적 파일 경로 추적 경고 4개 있음 |
| `npm run test:production` | production 기본 fixture 차단, 명시적 로컬 QA 허용, Vercel 환경 모사에서 override 차단 3개 통과 |
| `npm run format:check` | 통과 |
| 화면 확인 | `test-results/ko-light-desktop.png`, `ko-dark-mobile.png`, `astryx-mobile-filters.png` 확인. 검색 아이콘, 카드 위계, 측면 필터 유지 |

변경한 UI: Astryx Button/Badge/Skeleton, DropdownMenu 라디오 언어 선택, Dialog 기반 모바일 필터. Astryx Field와 네이티브 input을 조합해 URL/date/file 타입, FormData, controlled/uncontrolled 입력, 브라우저 검증을 유지한다. native select/textarea와 기존 커스텀 테마 switch는 유지한다. `radix-ui`, `class-variance-authority`, `components.json`, 기존 Sheet 구현은 제거했다. 미리 빌드된 Neutral CSS를 사용하며 원격 폰트와 StyleX 빌드 플러그인은 추가하지 않았다.

검증 중 발견·수정:

- 저장된 수동 테마를 첫 클라이언트 렌더에서 바로 전달하면 Astryx wrapper의 SSR 속성이 달라졌다. 서버와 초기 hydration은 system으로 맞추고 `useSyncExternalStore`의 hydration 이후 값으로 수동 모드를 전달했다. 색상은 기존 html 클래스와 CSS 상속으로 유지하며, 테마 E2E의 console error/pageerror 검사를 통과했다.
- 모달 열림 애니메이션 중간의 반투명 색상을 axe가 측정했다. `getAnimations().finished`로 완료를 기다린 뒤 동일한 대비 검사를 실행해 통과했다.
- Astryx 버튼의 내장 `role=status`가 기존 제품 결과 메시지 선택자와 겹쳤다. 테스트는 기대한 결과 문구로 상태 영역을 구분한다. Next 스트리밍/탐색 중 숨겨진 이전 DOM을 잡는 폼/링크 선택자는 현재 접근 가능한 main 영역으로 한정했다. 검증 항목을 삭제하거나 건너뛰지 않았다.
- 테스트 서버 동시 실행 시 공용 `.next-test` 잠금 충돌이 있어 공개 테스트를 별도 포트/출력 디렉터리로 실행했다. 로컬 DB/포트 접근은 필요한 실행 권한으로 재시도했다. Turbopack의 실패 캐시는 `/tmp/duoready-astryx-turbopack-cache-20261029`에 보존한 뒤 새 캐시로 빌드했다.

한계: Chromium 기준이며 Safari/Firefox·실기기 검증은 하지 않았다. 개발 모드의 언어 경로 전환에서 React의 script 태그 경고가 관찰되며 해당 언어 전환 검사는 통과한다. 빌드의 아이콘 저장 경고는 이번 UI 교체 범위 밖이며 남겨 둔다. 실제 외부 배포는 수행하지 않았다. 아래 기록은 이전 작업의 이력이다.

검증일: 2026-10-29 (Asia/Seoul). macOS arm64, Node.js 22.14.0, npm 10.9.2.
검증 대상: Next.js 16.4.3 / React 19.3.1 / TypeScript 6.0.3. 외부 계정 없이 로컬 실행.

## 초기 001 실행 결과

| 명령 / 검사 | 결과 |
| --- | --- |
| `npm run lint` | 통과, 오류·경고 없음 |
| `npm run typecheck` | Next route type 생성 및 tsc 통과 |
| `npm test` | 3개 파일, 9개 테스트 통과 |
| `npm run test:e2e` | Chromium 14개 테스트 통과 (재시도 없음) |
| axe WCAG 2 A/AA, 2.1 AA | ko/en × light/dark 및 모바일 Sheet에서 위반 0건 |
| 반응형 | 360/768/1440px 가로 넘침 없음, 카드 1/2/3열 |
| `npm run build` | production 빌드 통과; 홈/상세/안내 SSR, robots/sitemap 정적 |
| `npm run test:production` | 기본 production 차단 / 로컬 QA 허용 / Vercel 환경 모사 차단 3개 통과 |
| `npm run format:check` | 통과; Next가 재생성하는 next-env.d.ts는 포맷 대상에서 제외 |
| 자산 및 화면 확인 | 직접 작성한 SVG 도식, 공식 자산 없음. 한국어 라이트/다크 데스크톱과 모바일 캡처 확인 |
| Spec Kit prerequisites | spec/plan/tasks 및 research/data-model/contracts/quickstart 탐색 성공 |

## 확인한 사용자 동작

- 한국어·영어·별칭 검색, 교집합 필터, 정렬, 24개/6개 페이지 분할, 페이지 범위 보정.
- URL 새로고침, 뒤로 가기, 초기화 후 이전 상태 복원, 검색·필터 변경 시 page 초기화.
- 루트 언어 협상, 1년 언어 쿠키, 직접 언어 경로 우선, 미지원 브라우저 언어의 영어 fallback.
- 검색 결과 → 상세 → 언어 전환 → 목록에서 slug/query 유지, 두 언어 모두 KR 표시.
- 누락 및 needs-review 번역의 원문 표시와 lang 속성.
- 테마 새로고침 저장, 시스템 모드에서 OS 변경 반영, 수동 모드는 OS 변경 무시.
- 테마 흐름 중 pageerror/console error 0건; hydration 오류 없음.
- 모바일 Sheet 필터 개수·초기화, Escape 닫기, 트리거로 초점 복귀.
- 빈 결과, 준비 중 데이터, 존재하지 않는 앱/페이지/언어 구분.
- canonical/hreflang, noindex, robots 차단 및 fixture URL 없는 sitemap.
- 가상 앱 30개가 모두 KR이며 근거 배열은 비어 있고 검토·변경일은 null.
- production 차단은 목록 HTML뿐 아니라 가상 앱 상세에서도 확인. Vercel은 실제 배포가 아닌 환경 변수 모사다.

## 검증 중 수정

1. 라이트 배지의 예시 문구에 적용한 opacity가 대비를 낮춰 제거했다.
2. 화면 검사에서 스트리밍 중 임시 DOM 대신 표시 중인 그리드를 검사하고 카드 렌더링을 기다리도록 수정했다.
3. 테마의 mounted 상태는 useSyncExternalStore로 구분해 effect의 동기 setState 경고를 없앴다.
4. shadcn CLI가 생성한 `cn` 외부 import를 프로젝트 `@/lib/utils`로 연결하고 불필요한 의존성을 제거했다.
5. 데스크톱 768px 높이에서도 첫 카드 일부가 보이도록 hero 높이를 조정했다.

## 한계와 후속 검증

- 브라우저 자동 검증은 Chromium이다. Safari/Firefox, 실제 모바일 기기, 스크린리더 수동 검증은 출시 단계에 남아 있다.
- 자동 접근성 위반 0건은 모든 접근성 요구사항의 완전한 인증을 의미하지 않는다.
- 실제 Supabase 연결/DB 오류, Auth, RLS, 승인 트랜잭션, 수집 API는 아직 구현하지 않아 검증 대상이 아니다.
  현재 오류 boundary와 데이터 미연결 화면은 준비되어 있으며 실제 DB 연동 실패 시나리오는 003에서 검증한다.
- fixture의 네 가지 상태는 UI 예시다. 실제 데이터의 공식 근거 충족 여부나 앱 지원 여부를 검증한 것이 아니다.
- 최종 기기 자산, 운영 도메인, Supabase/Vercel 프로젝트·계정 설정, 실제 검토 데이터는 후속 작업이다.
- 외부 프로젝트 생성, 원격 Git 푸시, 운영 배포는 수행하지 않았다.

스크린샷과 실패 시 trace는 로컬 `test-results/`에 생성되며 커밋 대상에서 제외한다.
재현 방법은 README.md 및 specs/001-design-app-directory/quickstart.md에 있다.


## 추가 검증 — Apple 참고 디자인 및 compact UI (2026-10-29)

검증 범위는 T022–T024의 디자인 토큰, 헤더 제어, 로고·파비콘, 간결한 hero 및 카드 배치다.
이 기록은 기존 자체 SVG 기기 자리표시자를 표시하는 화면에 대한 것이다. 이후 요청된 3D 기기 렌더의
생성·연결·자산 권리 확인은 이 검증에 포함하지 않으며, 이미지 작업이 완료되었다는 의미가 아니다.

| 검사 | 결과 및 근거 |
| --- | --- |
| `npm run lint` | 추가 감사에서 재실행 통과, 오류·경고 없음 |
| `npm run typecheck` | 추가 감사에서 route type 생성·tsc 통과 |
| `npm test` | 추가 감사에서 3개 파일·9개 테스트 통과 |
| `npm run format:check` | 추가 감사에서 통과 |
| `npm run test:e2e` | `/tmp/duo-compact-final-e2e.log` 확인: Chromium 15개 테스트 통과, retries=0 |
| 접근성·반응형 | 위 E2E에서 ko/en × light/dark 및 모바일 Sheet의 axe 위반 0건; 360/768/1440px 가로 넘침 없음과 1/2/3열 통과 |
| `npm run build` | `/tmp/duo-compact-final-build.log` 확인: production 빌드·TypeScript 통과, `/icon.svg` 정적 경로 생성 |
| 첫 화면 탐색 | 1440×768에서 두 언어·두 테마 모두 검색 입력 하단 약 474px, 첫 카드 상단 약 554px. 검색과 카드 일부가 첫 화면에 표시됨 |
| 전체 너비 도구 행 | 같은 브라우저 감사에서 toolbar와 directory grid 너비 모두 1240px |
| 로고·파비콘 | `/brand/duo-mark.svg`, `/icon.svg` 모두 HTTP 200 및 `image/svg+xml`; 실제 헤더 이미지 로드와 favicon link 확인. 두 SVG 도안은 동일함 |

추가 레이아웃/자산 전달 확인 로그는 `/tmp/duo-compact-layout-audit.log`에 남겼다. `/tmp` 로그는
로컬 증거이며 저장소 파일이 아니므로 지속적인 검증 요약은 이 문서를 기준으로 한다.

### 확인한 변경 동작

- Globe 트리거는 표시 텍스트 없이 접근 가능한 언어 라벨을 제공한다. 닫힌 상태에 한국어 문구가
  없고, Enter/ArrowDown으로 열기·선택 항목 표시·Escape 닫기·초점 복귀·키보드 언어 전환이 통과했다.
- 라이트·다크·시스템의 세 버튼에 접근 가능한 이름과 `aria-pressed`를 제공한다. 수동 선택 저장,
  새로고침, 시스템 모드의 OS 연동, 수동 테마가 OS 변화를 따르지 않는 동작을 확인했다.
- 테마 흐름에서 pageerror/console error가 없었다. 검색·필터·정렬·페이지·뒤로 가기·언어 전환의
  기존 회귀 테스트와 번역 fallback·KR 표시·빈 상태·404·메타데이터 검사도 통과했다.
- 코드 확인: 44px 데스크톱/32px 모바일 hero, 전체 너비 검색 도구 행, 가로 아이콘·이름 카드 헤더,
  15px 두 줄 요약, 배지·카테고리 행, 검토일 footer, 18px 카드 모서리와 24px 내부·카드 간격.
- 코드와 전달 확인: 자체 파란 듀얼 패널·체크 SVG 로고 및 같은 도안의 파비콘. 이 로고 검증은
  제품 기기 이미지의 실물 정확성 또는 권리 검증과 별개다.

T023 구현과 T024 UI 검증을 완료로 표시했다. 핵심 탐색 기능·fixture 정책 변경이나 외부 배포는 없다.
최초 기록의 production 환경 노출 정책 3개 결과는 유지되며, 이번 UI 감사에서 그 명령을 재실행한 것은 아니다.

## 2026-10-29 — 실물 참고 3D 렌더 로컬 적용

- 공식 제품 페이지와 두 제품 사진을 임시 폴더에서 확인한 뒤 built-in image_gen으로 새 렌더를 생성했다. 공식 사진 원본은 저장소에 포함하거나 서비스에서 제공하지 않는다.
- `public/device/iphone-duo-render.png`: 1536×1024 PNG, alpha 있음, 약 1.9MB. `src/lib/device-asset.ts`에 원본 크기를 예약하고 Next Image의 140px/300px sizes로 표시한다. 두 언어의 alt 및 `AI 렌더링 · 화면 예시` / `AI render · example screen` 캡션을 적용했다.
- 실제 제품 외형에 대한 시각적 근사이며 치수·버튼 배치의 정확성을 보증하는 CAD 모델이 아니다. Apple의 사진 사용 정책을 확인하고 공개 사용 권리 **미확인**으로 기록했다. AI 생성이나 출처 표기를 권리 허가로 간주하지 않는다. 상세 출처·정책·프롬프트는 `docs/assets.md`, `docs/references/duo-render-prompt.md`에 있다.
- 최종 코드에서 `npm run lint`, `npm run typecheck`, `npm test`(9 tests), `npm run format:check`, `npm run test:e2e`(15 tests, 8.9s), `npm run build` 통과.
- E2E는 ko/en × light/dark에서 360/768/1440px 넘침·1/2/3열, axe 접근성, locale·테마·검색·필터·상세 흐름을 확인했다. 새 `test-results/ko-light-desktop.png`, `ko-dark-desktop.png`, `ko-light-mobile.png`를 시각 검토해 이미지 로드와 두 테마 배경 결합을 확인했다.
- 처음 제한 샌드박스 실행은 서버 포트 바인딩 EPERM으로 E2E 및 Turbopack build가 실패했다. 허용된 실행 환경에서 E2E를 통과했고, 실패가 캐시된 생성용 `.next/cache/turbopack`와 `.next/build`를 비운 뒤 build도 통과했다. 소스 수정으로 오류를 숨기지 않았다.
- 최종 로그: `/tmp/duo-render-e2e.log`, `/tmp/duo-render-build.log`. 운영 배포·외부 프로젝트 생성·권리 허가 요청은 하지 않았다.

## 2026-10-29 — 레이아웃·단일 테마 토글·스토어 분류 정정

- 사용자의 큰 3칸 테마 선택기 피드백에 따라 라이트/다크 단일 `role=switch`로 교체했다. 터치 영역 60×44px, 시각 트랙 48×28px. 기본은 기존 `defaultTheme="system"`을 유지한다. 첫 방문 OS 변경 추종, 수동 선택 후 저장·새로고침 유지·OS 변경 무시, Space 키 조작, hydration 오류 없음 등을 E2E에서 확인했다. 별도 시스템 선택 UI는 제거했다.
- 공통 폭 1120px, desktop hero 양쪽 균형, 검색/결과/카드 왼쪽 정렬, 왼쪽 지원 상태·카테고리, 20px 카드 간격·패딩을 적용했다. 모바일은 중앙으로 쌓은 소개·150px 기기 이미지와 필터 Sheet를 사용한다. 한국어 제목·카드 요약의 단어 중간 줄바꿈을 보완했다.
- 4개 임의 분류를 Apple 공식 명칭 기반의 현재 목록용 9개 분류로 바꿨다. Google Play 분류나 App Store 전체 분류를 구현했다고 주장하지 않는다. 실제 앱의 분류를 임의 판정하지 않으며, 현 가상 앱에는 내용에 맞는 예시 분류만 명시했다. 기존 `creativity` 쿼리 호환과 음악/도서/내비게이션 예시 분리 단위 검증을 추가했다.
- 30개 가상 앱 요약은 서로 다른 짧은 설명으로 바꾸되 각 문장에 가상임을 명시했다. 실제 근거·확인일·실제 지원 주장을 추가하지 않았다.
- 검증: `npm run lint`, `npm run typecheck`, `npm test` **11개**, `npm run format:check`, `npm run test:e2e` **15개(10.3s)**, `npm run build` 통과. 마지막 CSS 단어 줄바꿈 변경 후 responsive/a11y 4개(2.8s)를 다시 통과했다.
- 스크린샷: `test-results/ko-light-desktop.png`, `en-dark-desktop.png` 등을 검토했고 실제 in-app browser의 390×844 홈에서 작은 토글, 중앙 소개, 필터와 카드 표시를 확인했다. 360/768/1440px의 가로 넘침 없음과 1/2/3열, 두 언어·두 테마 axe 위반 없음은 자동 검사로 확인했다.
- React 검토: SSR 목록 유지, 클라이언트 컴포넌트 범위 유지, 테마 값은 resolvedTheme에서 파생, 이벤트에서만 수동 테마 저장, 추가 effect/외부요청 없음. 접근 가능한 switch 이름·checked 상태·언어 메뉴 초점 복귀 유지.
- 로그: `/tmp/duo-layout-v3-e2e.log`, `/tmp/duo-layout-v3-visual.log`, `/tmp/duo-layout-v3-build.log`. 현재 로컬 주소는 `http://127.0.0.1:3000/ko` 및 `/en`; 실행은 `npm run dev`.
- Supabase 실제 데이터/관리자 기능/외부 배포는 여전히 후속 범위다. 기기 이미지는 생성된 로컬 시안이며 공개 사용 권리 미확인 상태를 유지한다. 공식 사진 원본은 서비스에 포함하지 않는다.

## 2026-10-29 — 카피 정리와 로컬 Supabase·운영 설정 준비

검증 범위는 T029–T032의 로컬 도구와 환경 계약이며 PRD 002/006의 준비 단계다. 기존 001 완료
기록을 유지한다. 한국어 상단 카피를 “iPhone Duo 앱 지원 현황” / “앱별 지원 상태와 근거를
확인하세요.”, 영어를 “iPhone Duo app support” / “Check each app’s support status and sources.”로
변경했다. 앱 테이블·RLS·관리자 인증·실제 공개 목록 DB 조회는 구현하거나 검증한 범위가 아니다.

### 로컬 스택과 환경 파일

- Supabase CLI 2.122.0, Node.js 22.14.0, Postgres 17로 확인했다. 최초 Docker 실행은 내부 VM
  디스크 부족으로 DB 초기화 중 `No space left on device`가 발생했다. 당시 호스트 여유 공간은
  약 488GiB로 별개였다. 기존 Docker 볼륨은 삭제하지 않았고 이번에 실패한 컨테이너만 중지했다.
- `[experimental] stack = true`와 공식 Apple Silicon native runtime으로 전환했다.
  `npm run db:start -- --runtime native --eager` 후 database, pgmeta, rest, auth, studio, mail
  모두 healthy였다. API 55321, DB 55322, Studio 55323, mail 55324의 LISTEN 주소는 모두
  `127.0.0.1`로 확인했다. 실험적 CLI의 호환성 제한과 버전 고정 이유는 `docs/environments.md`에 남겼다.
- `npm run db:env`가 필요한 로컬 공개 설정만 `.env.local`에 생성했고 권한은 `0600`이었다.
  기존 파일을 둔 채 재실행하면 exit 1로 거부하며 파일 바이트가 변경되지 않음을 확인했다.
  키·비밀번호 값은 이 기록에 포함하지 않는다.
- `supabase/supabase.lock`은 버전·digest 정보만 포함하며 비밀 값이 없음을 검토했다.
  `npm run db:stop`으로 데이터를 보존한 뒤 `npm run db:start -- --frozen`으로 재시작했고,
  lock 파일 변경 없이 연결 smoke가 다시 통과했다. 기본 재시작은 lazy 서비스 방식이므로
  Studio/pgmeta의 sleeping 표시는 정상이며 요청 시 다시 시작한다. 재시작 뒤
  `http://127.0.0.1:55323` 요청이 HTTP 200으로 응답해 Studio가 요청에 따라 다시 시작함도 확인했다.
- `package.json`과 `package-lock.json`의 dependencies/devDependencies/engines 일치 검사를
  통과했다. `.dockerignore`에 환경 파일과 생성 디렉터리를 제외하도록 추가했다.

### 명령과 회귀 검증

| 명령 / 검사 | 결과 |
| --- | --- |
| `npm run env:check` | `PASS local: supabase-configured`; 네트워크 호출 없는 설정 계약 검사 |
| `npm run db:check` | Auth health와 REST schema 각각 HTTP 200; 재시작 후에도 두 응답 모두 200 |
| `VERCEL=1 VERCEL_ENV=preview npm run env:check` | 로컬 환경 값으로 실행 시 exit 1로 거부; 실제 Vercel 배포 없이 CLI 동작 확인 |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | 모두 통과 |
| `npm test` | 18개 테스트 통과 |
| `npm run test:e2e` | Chromium 15개 통과, 10.5초, 재시도 없음 |
| `npm run build` | production 빌드 및 TypeScript 통과 |
| `npm run test:production` | 기본 production fixture 차단 / 명시적 로컬 QA 허용 / Vercel 환경 모사 차단 3개 통과 |

브라우저 검증은 ko/en × light/dark의 360/768/1440px 반응형·접근성과 기존 검색·필터·URL·언어·
테마·Sheet 흐름을 포함한다. `test-results/`의 두 언어·두 테마 desktop/mobile 캡처 8개와
`/tmp/duo-copy-ko-mobile.png`, `/tmp/duo-copy-en-mobile.png`를 검토했다. 새 제목은 데스크톱과
360/390px 모바일에서 한 줄로 표시됐고 잘림·겹침·가로 넘침이 없었다.

빌드 원본 로그는 `/tmp/duo-infra-build.log`다. `/tmp/duo-ready-ui-regression-20261029.txt`는
명령 결과·화면 검토를 정리한 기록이며 E2E 원본 콘솔 로그가 아니다. 해당 실행은 list reporter로
별도 원본 콘솔 로그나 HTML report를 생성하지 않았다. `.last-run.json`은 passed와 빈 failedTests를
기록했다. `/tmp`와 `test-results/`는 로컬 증거이며 저장소에 보관하는 검증 요약은 본 문서다.

### 완료 범위와 남은 외부 설정

T029–T032를 로컬 검증 완료로 표시했다. 읽기 전용 외부 조회에서 duo-ready 전용 프로젝트가
없음을 확인했으며 기존 yono DB는 사용하지 않았다. 외부 프로젝트 생성·원격 연결·배포는 하지 않았다.
향후 전용 Supabase 프로젝트와 별도 Preview 데이터 환경, Vercel 프로젝트·도메인 연결이 필요하다.
설정 검사나 Auth/REST 응답 성공을 실제 앱 데이터·권한 검증으로 해석하지 않는다. 앱 테이블·RLS·
관리자·공개 DB 조회는 002/003, 운영 설정과 출시 검증은 006에 남는다. 기기 렌더의 공개 사용
권리 미확인 상태도 유지한다.

## 2026-10-29 — 로컬 PostgreSQL 단독 전환

사용자 후속 선택에 따라 로컬 데이터 서비스를 PostgreSQL 하나로 바꾸고 T033–T035를 검증했다.
위 Supabase/native 결과는 당시의 이력으로 보존하며 현재 실행 안내는 `docs/environments.md`와
README의 Compose 흐름을 따른다. 향후 운영 대상은 Vercel + Supabase를 유지한다.

### 전환과 데이터 보존

- 이번에 다운로드한 Supabase Docker 이미지 7개를 제거했다. 이후 `docker image ls`의
  supabase/kong/mailpit 조회 결과가 없음을 확인했다. native 스택은 중지했지만 데이터·cache는
  보존했고 다른 프로젝트의 컨테이너·볼륨은 삭제하지 않았다.
- 공식 PostgreSQL 17.11 이미지와 digest를 `compose.yaml`에 고정했다. 서비스 `db`가 healthy,
  DB가 `duo_ready`, 바인딩이 `127.0.0.1:55322`임을 확인했다. 전용 named volume을 사용한다.
- 이번 작업에서 만든 기존 `.env.local`의 4개 값이 변경되지 않았음을 먼저 확인한 뒤 새
  PostgreSQL용 3개 값으로 교체했다. 권한은 `0600`이다. 반복 `db:env`는 exit 1이며 파일 바이트가
  동일했다. 연결 문자열·비밀번호는 이 기록에 출력하지 않는다.
- `env:check`가 `postgres-configured`로 통과했고 `db:check`가 실제 SQL `SELECT 1`, 현재
  데이터베이스 및 서버 버전 조회에 성공했다. Auth/REST HTTP health를 DB 연결 검증으로 대신하지 않았다.
- 임시 nonce 테이블에 검증 행을 저장한 뒤 Compose stop/start를 수행했다. 같은 행이 유지됨을
  확인하고 임시 테이블을 삭제했다. 실제 데이터 보존 검증이며 앱 테이블이나 seed를 추가한 것은 아니다.
- Supabase CLI 개발 의존성과 로컬 config/lock을 제거하고 SQL 검사에 `pg@8.23.1`을 사용한다.
  로컬 Auth·PostgREST·Studio는 실행하지 않는다. 서버 전용 `DATABASE_URL`, hosted Supabase
  환경 검사, Preview/Production 분리와 fixture 차단을 유지한다.

### 최종 회귀 결과

| 검사 | 결과 |
| --- | --- |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | 모두 통과 |
| `npm test` | 20개 통과 |
| `npm run test:e2e` | Chromium 15개 통과, 9.6초 |
| `npm run build` | production 빌드 통과 |
| `npm run test:production` | 기본 production 차단 / 로컬 QA 허용 / Vercel 모사 차단 3개 통과 |
| 로컬 DB | healthy·loopback 바인딩·실제 SQL 연결·중지 후 행 보존 통과 |
| 환경 파일 | `0600`, 기존 파일 재생성 거부 및 바이트 불변 통과 |

로그는 `/tmp/duo-postgres-e2e.log`, `/tmp/duo-postgres-build.log`다. 기존 001 검증은 유지하고
현재 PostgreSQL 전환까지 T001–T035를 로컬 완료로 표시한다. 외부 프로젝트 생성·연결·배포는
수행하지 않았다. 앱 테이블·권한/RLS·관리자·실제 공개 목록 조회와 기기 자산 공개 권리는 남아 있다.

바로 다음 권장 작업은 **002-A 앱 초안 저장 기반**으로, `apps`, `app_translations`,
`app_store_listings` 마이그레이션과 중복 차단·초안 공개 차단이다. 해당 작업과 전체 002 구현은
이번 PostgreSQL 전환에서 시작하지 않았다.

## 2026-10-29 — 002–004 연속 개발 중간 기록

이하 작업은 진행 중이며 최종 완료 검증이 아니다.

- 기존 개발 채팅의 완료를 확인하고 PostgreSQL 17.11 구성에서 시작했다. 외부 프로젝트 생성·배포는 없다.
- 002/003/004에 독립 spec/plan/research/data-model/contracts/quickstart/tasks를 작성했다. 각 명세 품질 체크리스트 16개를 검토했다. 이는 구현 완료 표시가 아니다.
- 마이그레이션 실행기는 체크섬·advisory lock·트랜잭션을 사용한다. `test:db`는 별도 `duo_test_*` DB를 만들고 종료 후 삭제한다. 현재 새 마이그레이션은 임시 DB에서만 적용했으며 기존 앱 DB는 변경하지 않았다.
- 최근 `npm run test:db`는 7개 통과: 비소유자 anon/authenticated 정책, 비관리자 쓰기·자기 권한 부여 차단, 관리자 회수, 연결 재사용 신원 분리, 마이그레이션 변경 감지·재실행·실패 롤백, 중복·편집 충돌·번역 검토 상태, 공개 마지막 감사 기록 실패 시 전체 롤백, 공개 snapshot 보존·정정·보관, 공개 SQL 검색·페이지·과거 주소·이력 비공개 필드 제외.
- 관리자 로그인·초안/근거/기능 편집·명시적 공개·보관 UI와 ko/en 메시지를 연결했다. 실제 Supabase Auth 계정은 연결하지 않았으므로 제공자 로그인/refresh/logout 실환경 검증은 남아 있다. 로컬 테스트 인증은 명시적 설정·loopback·개발 환경에서만 동작하고 production/VERCEL에서는 차단한다.
- `npm run test:admin`은 별도 포트 3350/.next-test 서버와 임시 DB에서 6/6 통과(9.0초). 익명 차단, 로그아웃 후 쿠키 재사용 거부, 초안 저장→공개→보관, 두 언어·두 테마의 360/768/1440px 넘침 없음과 데스크톱 axe 위반 0을 확인했다. 영어 라이트 전체 화면도 시각 검토했다. 첫 실행의 콤보박스 선택자 실패는 접근성 트리의 role/name 선택자로 수정했다.
- 관리자 UI 추가 시점 lint/typecheck 및 단위 테스트 24개가 통과했다. 이후 003 공개 UI 연결 작업을 시작했다. 최종 전체 회귀/E2E/build/production 검증과 004 가져오기·실제 API 표본 검증은 아직 남아 있다.

## 2026-10-29 — 002–004 통합 구현 검증 진행

- 004 URL/CSV 입력 확인, 512 KiB·200행 제한, 인용·개행·BOM 처리, 오류 행 보존, 중복 식별,
  1행 단위 처리·재개·실패 재시도, 비공개 근거 제안과 관리자 검토 링크를 구현했다.
- 실제 Apple KR Lookup 10개를 2026-10-29T05:29:22.856Z~05:29:50.178Z에 조회하여 모두 정규화했다.
  이름·개발사·버전·장르·필드 존재 여부와 요청 시각은 `docs/import-validation.md`와
  `tests/fixtures/apple-observed.json`에 기록했다. 카카오톡의 장르 6005는 현재 9개 범위 밖이므로 미분류다.
  이 실조회는 DB·공개 지원 판정에 쓰지 않았다. 실제 앱 100개 검토 완료로 보고하지 않는다.
- typecheck, lint, 단위 테스트 31개가 통과했다. DB 통합 테스트 9개는 실제 non-owner RLS,
  재실행/실패 rollback, 역할 회수, 초안·공개 경계, 이력 보존/재공개, 중복 수집,
  공개 스냅샷 보존, 로컬 관리자 환경 파일의 보존/권한/비출력까지 통과했다.
- 관리자·공개·가져오기 브라우저 기본 18개(43.9초)와 권한 회수 직접 POST/주소 변경·보관
  보강 2개(9.7초)가 통과했다. 두 언어·두 테마·360/768/1440px의 접근성/overflow 검사와
  공개 상세·가져오기 화면 캡처를 확인했다. 전체 핵심 흐름의 화면 조합과 5회 반복은 현재 진행 중이다.
- `npm run build`: 제한 환경에서 Turbopack 포트 바인딩 오류가 발생했고 해당 실패가 생성 캐시에
  남았다. `.next/cache/turbopack`만 임시 경로로 보존·분리하고 권한 확장으로 동일 명령을 실행하여
  컴파일·타입·페이지 생성이 모두 통과했다. 앱 코드/빌드 방식을 우회하지 않았다.
- `npm run test:production`: 운영 기본 fixture 차단, 명시적 로컬 QA 허용, Vercel override 차단 3개가
  통과했다. 관리자 로그인 비활성/위조 쿠키 거부 및 fixture 사이트맵 제외도 확인했다.
  Next의 스트리밍 redirect와 메시지 사전 직렬화를 실제 관리자 콘텐츠와 구분해 검사한다.
- `npm run test:production:db`: 실제 production 빌드 + 격리 DB에서 양 언어 목록·상세·이력·사이트맵은
  공개 앱만 포함하고 초안/보관/내부 메모를 숨기며 관리자 robots 규칙을 유지함을 확인했다.
- 현재 로컬 `duo_ready` DB에 마이그레이션 3개를 적용하고 재실행 시 0개 적용을 확인했다.
  `admin:local`로 개발 전용 관리자와 DB 모드를 설정했다. 기존 환경 값과 0600 권한을 보존하고
  비밀번호를 출력하지 않았다. 일반 앱 DB에는 가상 앱·근거·공개 seed를 넣지 않았다.
- Supabase hosted Auth/SQL/TLS, Vercel 배포, 실제 앱 콘텐츠 연구와 자산 권리 검토는 미수행이며 006 항목이다.
  로컬 개발 로그인과 격리 DB 테스트가 외부 실환경 검증을 대신하지 않는다.

## 2026-10-29 — 002·003·004 완료 감사

### 최종 실행 결과

| 검증 | 결과 |
| --- | --- |
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm test` | 9개 파일, 32개 테스트 통과 |
| `npm run test:db` | 9개 실제 PostgreSQL 통합 테스트 통과 |
| `npm run test:admin -- --repeat-each=5` | 핵심 30개 시나리오 × 5회 = 150회 통과, 9.1분 |
| `npm run test:admin -- --grep 'stopping finishes' --repeat-each=5` | 추가 중단·재개 시나리오 5회 통과, 32.2초 |
| `npm run test:e2e` | 기존 fixture 회귀 15개 통과, 10.8초 |
| `npm run build` | 최종 production 빌드 통과 |
| `npm run test:production` | fixture/로컬 인증/비공개 경계 3개 운영 모드 시나리오 통과 |
| `npm run test:production:db` | production 빌드 + 격리 DB의 공개 목록·상세·이력·사이트맵 경계 통과 |
| `npm run format:check` | 통과 |
| 실제 KR Apple Lookup | 10/10개 관찰 성공; 지원 판정 없음 |
| 현재 개발 서버 | 127.0.0.1:3000에서 실제 개발 계정 로그인·가져오기 접근·로그아웃·빈 공개 목록 확인 |

fixture 회귀의 첫 실행은 14/15였으며, 003에서 실제 업데이트 페이지로 대체한 이전 안내 페이지의
옛 제목을 기대하던 테스트를 수정했다. 현재 제목과 fixture 모드의 이력 미연결 안내를 함께 검증하고
전체 15개를 재실행했다. 로컬 서버 smoke도 스트리밍 렌더 완료를 기다리는 locator assertion으로
확인했다. 실패한 관찰을 제품 성공으로 숨기지 않았다.

최종 점검에서 development 모드/로컬 origin의 색인 허용을 막는 조건과 잘못된 DATABASE_URL의
Node 오류(`ERR_INVALID_URL`)에서 입력값을 제거하는 처리를 보완했다. 해당 회귀 단위 테스트와
최종 production 빌드/운영 모드 검증으로 확인했다.

### 요구사항별 증거

| 요구사항 | 구현 및 직접 검증 |
| --- | --- |
| 002 FR-001/007/010: 인증·권한·비공개·운영 차단 | `admin/auth.ts`, `supabase/auth.ts`, `proxy.ts`, `db/transaction.mjs`; access/transactions 통합 테스트, local-auth 단위 테스트, 익명·로그아웃 쿠키 재사용·권한 회수 후 직접 POST E2E, production 검사. 실제 hosted 인증은 아래 경계 참조 |
| 002 FR-002/003/005/009: 필드·상태 분리·검토 시각·번역·충돌 | 001/002 SQL, admin input/repository/forms; drafts/publication 통합 테스트, admin 단위 테스트, 두 언어 관리자 E2E |
| 002 FR-004/006 및 SC-002/003: 상태별 근거·원자성·불변 이력 | supported/planned/unsupported의 근거 누락과 unknown 조사 사유 누락 거부; 마지막 감사 INSERT 실패 주입 시 공개/이력/검토일 전부 rollback; 정정·metadata-only 검토·보관·재공개 검사. 공유 출처는 검증부터 스냅샷까지 잠금 |
| 002 FR-008 및 SC-004: 언어·테마·뷰포트·키보드 | 가져오기→편집→공개→상세 흐름의 ko/en × light/dark × 360/768/1440 조합 12개를 각 5회 검증. 로그인 Tab/Enter와 검토 Space/Enter 포함. 관리자·공개·가져오기 axe/overflow 및 캡처 검사 |
| 003 FR-001/002/003 및 SC-001/003: 실데이터 탐색·정책·오류 구분 | postgres-query 및 명시적 data source; directory 통합 테스트의 이름/별칭/복합 필터/정렬/24개 페이지·초안 제외, DB 조회 실패 E2E, fixture 회귀 15개, production 데이터 검사 |
| 003 FR-004/005/009: 근거·버전·이력·fallback·HTML 안전 | 실제 데이터 상세의 공식 URL·발췌·기능·현재/지원 버전·검토일·정정 동선, 원문 fallback·null 발표일. public-data E2E의 script 문자열 비실행·내부 메모 부재 및 이력 DTO 검사 |
| 003 FR-006/007 및 SC-002: 공개 반영·과거 주소·보관 | 실제 관리자 공개/주소 수정 후 양 언어 목록·상세·업데이트, 검색 쿼리를 보존한 과거 주소 이동, 보관 후 양 주소/이력 숨김 E2E |
| 003 FR-008: SEO | locale canonical 검사, production DB 사이트맵의 공개 앱만 포함·초안/보관/fixture 제외·admin robots, indexing 조건 단위 검사 |
| 004 FR-001~007 및 SC-001~003: 가져오기·입력·오류·중복·보존 | parseImport/lookupApple, 003 SQL, 보호된 server actions; CSV 인용/개행/BOM/열/행/크기·URL/ID/국가·누락·429/timeout/과대 JSON 검증; 반복 CSV/부분 오류/재시도/중단·재개 E2E; import SQL의 앱/제안 dedup과 공개 판정·이력·검토일 불변 검사 |
| 004 FR-008~010 및 SC-004: 자산·UI·실제 응답 | 외부 이미지를 공개하지 않는 구현과 `docs/assets.md`; 두 언어/테마/뷰포트 접근성; 동일 lookup 모듈의 실제 10개 읽기 전용 probe와 시각·출처·필드 존재 기록 |
| 공통 명명 산출물·실행 환경 | 각 feature의 spec/plan/tasks/research/data-model/contracts/quickstart, 마이그레이션 3개, README·환경·실조회·자산·검증 문서. Spec quality checklist 각 16/16; extension hook 설정 없음 |

### 현재 로컬 상태와 명시적 외부 경계

읽기 전용 확인 결과 로컬 마이그레이션 이력은 3개, 활성 개발 관리자는 1명, 앱과 공개 항목은 각각
0개, `.env.local` 권한은 0600이다. 기능 사용을 위한 개발 계정 외에 실제/가상 콘텐츠를 자동 공개하지 않았다.
마이그레이션 재실행은 0개 적용이었다. 외부 프로젝트·배포·푸시·메시지 전송은 수행하지 않았다.

002~004의 완료 범위는 로컬 운영 가능한 도구·데이터 흐름과 위 검증이다. **실제 Supabase hosted
로그인/로그아웃/세션 갱신·만료/권한, SQL·TLS·프로젝트 분리의 외부 검증, Vercel 배포·도메인,
실제 앱 약 100개 근거 조사, 기기 렌더/아이콘 권리 검토는 미완료이며 006 출시 경계에 남는다.**
005의 자동 변경 감지·검토 대기함·사용자 제보를 구현했다고 보고하지 않는다.

## 2026-10-29 — 실제 초기 데이터 후속 등록

- 사용자 지적에 따라 콘텐츠 작업을 수행했다. Apple 공식 컬렉션 3곳에서 중복 제외 후보 133개를 확보하고 기존 KR Lookup으로 재조회했다. 128개를 일반 로컬 DB에 실제 초안으로 저장했고, 5개는 KR 결과 없음으로 가져오기 행에 남겼다.
- 기존 로컬 관리자와 authenticated 역할/RLS 및 import_app/save_app 함수를 사용했다. 공개 함수는 호출하지 않았다. DB 검증 결과 앱 128, 초안 128, 공개 0, 근거 22, 사람의 검토일 0, 공개 감사 이벤트 0이다. 기존 분류 밖 65개를 임의 분류하지 않았다.
- 22개는 앱별 KR 업데이트 설명에서 직접적인 듀오 지원·최적화 문구를 읽고 짧은 원문 발췌·관찰 버전·ko/en 설명을 준비했다. 수집 시각을 검토일로 사용하지 않았고 발표일을 만들어 넣지 않았다. 공개 승인 대상과 전체 결과는 docs/initial-data.md 및 docs/data/initial-app-{import,reviews}.json에 기록했다. 100개 공개 목표는 미달성이다.
- 128개 동일 자료 재입력은 모두 duplicate였고, 검증 트랜잭션을 rollback하여 수집 시각도 보존했다. 브라우저에서 실제 관리자 목록과 VLLO 편집 화면의 초안·버전·양언어 설명·원문 근거를 확인했다.
- 이번 실행에서 lint/typecheck, 단위 32개, fixture E2E 15개(11.4초)는 통과했다. 이후 공유 작업 폴더에 추가 중인 운영 기능 코드 때문에 build는 실패했다. 첫 실패는 collection.test.ts가 당시 아직 없던 collection/web.mjs를 참조한 것이고, 모듈 생성 후 재시도는 admin/operations-actions.ts:49의 string | null → null | undefined 타입 불일치였다. 해당 코드는 이번 데이터 작업에서 수정하지 않았다. 전체 최신 트리의 빌드가 통과했다고 보고하지 않는다.
- 이번 작업은 로컬 DB 콘텐츠와 문서 변경이다. 제품 코드·스키마 변경, 외부 프로젝트 생성·공개 배포는 수행하지 않았다. 초기 공개는 사람의 명시적 승인 대기다.

## 2026-10-29 — 앱 아이콘 원본의 로컬 저장

- 외부 아이콘 URL만 보관하던 구현을 로컬 원본 파일 + PostgreSQL 메타데이터로 변경했다.
  마이그레이션 `005_app_icon_assets.sql`은 관리자 쓰기 및 공개 상태에 따른 읽기 RLS를 적용한다.
  일반 로컬 DB에는 당시 적용된 001~003에 005만 추가했다. 별도 작업의 004는 이 실행에서 적용하지 않았다.
- Apple 이미지 호스트·HTTPS·리다이렉트 거부·8초·2 MiB·2048px·실제 디코딩 검증을 적용한다.
  파일을 원자적으로 저장한 뒤 DB를 갱신하며, 실패 시 이전 포인터를 보존한다. 오래된 원본 URL의
  수집 결과는 현재 메타데이터를 덮지 않는다. 파일은 Git에서 제외한다.
- 실제 원본 JPEG 128개, 총 4,105,819바이트를 저장했다. 재실행은 해시 검증 후 128개 모두 skip,
  실패 0개였다. 읽기 전용 재확인에서 앱은 초안 128개, 공개 항목 0개다.
- 우리 서버 이미지 API를 관리자 목록·편집과 공개 카드·상세에 연결했다. 공개 아이콘은 해당 앱의
  직접 App Store 배지 링크를 동반한다. 파일 실패는 일반 아이콘으로 대체하며 외부 URL로 우회하지 않는다.
  실제 관리자 화면에서 원본 아이콘을 확인하고 `/tmp/duo-stored-icons.png`에 화면을 저장했다.
- 단위 12개 파일/45개 테스트, 실제 PostgreSQL 통합 14개, lint/typecheck가 통과했다.
  아이콘 단위·통합 검사는 잘못된 출처/형식/크기·파일 손상·경로 탈출·Vercel 차단,
  초안 RLS·게시/보관·갱신 실패 보존·오래된 출처 거부를 포함한다.
- 관리자 E2E 전체 재실행은 36/37 통과였다. 실패 1개는 검사 도중 별도 작업에서 `next.config.ts`가
  변경되어 서버가 재시작되고 로컬 로그인 세션이 사라진 가져오기 중단·재개 시나리오다.
  서버 재시작 로그와 로그인 리다이렉트 trace로 확인했고, 해당 시나리오만 재실행하여 1/1 통과했다.
  아이콘 E2E는 외부 HTTPS 요청을 막은 상태의 표시·원본 바이트 일치·ko 360px/en 1440px·
  카드 이동·초안/보관/로그아웃 접근 차단·파일 누락 fallback을 통과했다.
- 초기 아이콘 E2E의 상대 src 선택자는 hydration 후 절대 URL을 놓쳤다. 경로 suffix 선택자로 고치고,
  로그아웃 후 API 검사는 로그인 페이지 이동 완료를 기다리도록 수정했다. 앞선 전체 실행에서는
  테스트 결과 파일 ENOENT도 발생하여 결과 디렉터리를 `/tmp/duo-icons-*-results`로 분리했다.
  이 실패들을 제품 통과로 집계하지 않았다.
- fixture E2E는 처음 14/15였다. 별도 작업으로 교체된 제보 페이지의 예전 제목을 기대하던 테스트가
  최신 페이지 기준으로 갱신된 뒤 전체를 다시 실행하여 15/15 통과했다(14.5초).
  fixture 설정에서는 DB가 필요한 새 아이콘 시나리오를 제외하고 관리자 테스트 설정에서 실행한다.
- `format:check`는 Next가 갱신한 tsconfig 포맷을 정리한 후 통과했다. 변경한 아이콘 파일의 포맷도 통과했다.
  production 빌드는 통과했다. 최초 제한 환경의 Turbopack 포트 바인딩 실패 캐시는 임시 디렉터리에
  보존·분리한 뒤 권한 확장으로 재실행했다. 빌드 방식을 바꾸거나 검사 오류를 무시하지 않았다.
- Supabase Storage 어댑터·외부 배포는 구현/실행하지 않았다. 현재 로컬 파일 어댑터는 Vercel에서
  차단된다. 로컬 DB와 `.data/app-icons`를 함께 백업해야 한다. 자산 출처·조건은 `docs/assets.md`에 있다.
  앱 지원 판정·사람의 검토일·공개 승인은 이번 아이콘 작업으로 변경하지 않았다.

## 2026-10-29 — 005 변경 수집·검토·제보 완료 감사

이 절은 앞선 진행 기록 이후의 **최종 로컬 구현·검증 결과**다. 실제 hosted 서비스나 운영 Cron을
활성화한 결과로 해석하지 않는다. Spec Kit 명세·설계·작업 14개와 품질 체크리스트 16개를 완료했다.

| 검증 | 실제 최종 결과 |
| --- | --- |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | 모두 통과 |
| `npm test` | 12파일, 45개 통과 (동시 추가된 아이콘 테스트 포함) |
| `npm run test:db` | 임시 PostgreSQL DB 통합 14개 통과, 마이그레이션 재적용 및 자동 정리 포함 |
| `DUO_TEST_PORT=3354 npm run test:admin` | 전체 관리자·가져오기·공개 DB·005·아이콘 E2E 37개 통과, 2.7분 |
| `DUO_TEST_PORT=3354 npm run test:admin -- operations.spec.ts --repeat-each=5` | 005 핵심 시나리오 5개 × 5회 = 25개 통과, 2.9분 |
| `DUO_TEST_PORT=3355 npm run test:e2e` | fixture 공개 UI 15개 통과, 15.2초 |
| `npm run build` | 최신 production 빌드와 타입 검사 통과 |
| `npm run test:production` | 기본 운영 fixture 차단, 명시적 로컬 QA 허용, Vercel의 로컬 override 차단 모두 통과 |
| `npm run test:production:db` | 양 언어의 published-only 목록/상세/이력/사이트맵, 초안·보관·비공개 필드 차단 통과 |
| 실제 개발 서버 3000 smoke | 로컬 관리자 로그인→출처 수집/검토/제보 관리→로그아웃→비회원 제보 폼 확인 통과; 실제 제보 전송·공개 승인 없음 |
| `npm run db:migrate` / `npm run collect` | 새 004 운영 마이그레이션 적용, due 대상 0개로 단발 배치 정상 종료 |

### 요구사항 대조

- FR-001~005: `collection_targets/runs/observations`와 작은 배치 워커를 추가했다. HTTP 전에 실행·시도 기록을 커밋하고
  5분 lease로 중복 실행 및 중단 복구를 처리한다. 해시별 관측/후보는 처리 상태와 관계없이 유일하며 기각 후 같은
  콘텐츠를 재등록하지 않는다. 이전 버전·노트와 마지막 성공 관측을 보존하고 수집으로 초안·공개 상태·검토일을 바꾸지 않는다.
- 웹 수집은 별도 `node:https` 어댑터다. 정확한 공식 승인 호스트, 공인 IPv4 DNS 확인 및 실제 연결 IP 고정,
  TLS 호스트 검증, redirects 거부, robots 정책, 8초 전체 요청 제한, 2MiB 본문 제한, 제한된 재시도를 검증했다.
  DNS 혼합 사설 주소, DNS 지연, 느린 본문, 과대 본문, percent-encoded robots 경로, 리디렉션을 단위 테스트했다.
  HTML 및 wildcard 규칙은 과도한 정규식 backtracking을 피하는 스캔으로 처리한다. 실제 외부 웹사이트 정기 운용 검증은 아니다.
- FR-006~007: 검토 화면은 현재 공개 정보·후보·이전 관측·저장된 수정안을 비교한다. 승인·보류·기각과 사유,
  공식 근거 확인 및 앱/검토 revision 충돌을 처리한다. 마지막 검토 UPDATE에 실패를 주입해 공개 스냅샷·지원 이력·
  감사 기록·검토 상태 전체 rollback을 확인했다. 근거 없는 지원 판정과 오래된 앱 수정안의 승인도 거부한다.
- FR-008~010: 익명 폼은 앱 추가/정정·KR URL·내용·근거 URL만 파싱한다. 연락처/원본 IP를 저장하지 않는다.
  `submission_ingress.accept`의 좁은 SECURITY DEFINER 경계와 운영 테이블 RLS를 검사했다.
  7개 동시 DB 연결에서 visitor 한도 5개만 허용하고, 다른 토큰으로도 전체 60회 상한을 넘지 못했다.
  제보가 공식 근거로 자동 바뀌지 않으며 새 앱은 같은 App Store ID일 때만 연결한다.
  비회원 및 관리자 권한 회수 후 기존 Server Action 재호출이 거부되는 것을 브라우저에서 확인했다.
- FR-011: ko/en × light/dark에서 전 과정을 반복하고 360/768/1440px overflow, axe 접근성, 키보드 Space/Enter를 검사했다.
  검토 데스크톱과 실제 한국어 360px 다크 제보 화면을 캡처하여 확인했다. HTML 문자열은 실행되지 않았고 내부 사유·제보는
  공개 상세에 나타나지 않았다. 기본 fixture 모드에서는 새 제보 폼이 비활성화되어 저장할 수 없다.
- FR-012: 단발 최대 5개 배치와 로컬 `--watch`를 제공하고 Vercel/Preview/production에서 CLI를 거부한다.
  **반복 워커와 운영 Cron은 시작하지 않았다.** 운영 스케줄러의 신원·프로젝트 분리·실행 한도는 006에서 연결·검증한다.

### 진행 중 실패와 해결

기능 구현 전 새 DB/어댑터 테스트는 미구현 상태로 실패했다. 브라우저 검증 중 select의 실제 접근성 이름을 기준으로
선택자를 수정하고, 처리 중 버튼 문구 변경을 완료로 오인하지 않도록 정확한 최종 상태를 기다리게 했다.
외부 요청 실패 시 공유 요청 간격 시각이 rollback되는 경로를 수정하고 실제 DB 회귀를 추가했다.

동시 아이콘 작업의 파일 수정과 테스트 서버 포트 충돌이 있어 중간 전체 실행을 중단·정리했다. `DUO_TEST_PORT`를
지정하면 포트·`.next-test-<port>`·결과 폴더가 분리되도록 검증 설정을 보완했다. 기본 동작과 production 출력은 유지한다.
중간 아이콘 E2E의 로그아웃 직후 응답 검사도 해당 작업에서 완료 대기로 수정되었고, 최종 전체 37개가 통과했다.
fixture 회귀에서 기대하던 005 이전 제보 placeholder는 실제 제보 제목과 fixture 모드 접수 불가 안내·버튼 비활성화로 갱신했다.

Turbopack에는 앞선 제한 환경의 포트 생성 오류가 캐시되어 첫 production 빌드가 실패했다. 생성 캐시만 `/tmp`에 보관한 후
같은 `npm run build`를 로컬 실행 권한으로 다시 실행해 통과했다. 소스·DB를 초기화하거나 빌드 검증을 우회하지 않았다.

### 실제 로컬 데이터와 남은 운영 범위

최종 읽기 전용 감사: 앱 128, 초안 128, 공개 항목 0, 근거 22, 마이그레이션 5개. 005의 감시 대상·수집 실행·검토 항목·
제보는 모두 0개다. 테스트용 가상 내용은 임시 `duo_test_*` DB에만 저장했으며 기존 실제 앱을 공개 승인하지 않았다.
다른 작업의 아이콘 파일 저장 기능을 덮어쓰지 않았다. 005는 운영자가 감시 대상을 등록하여 사용할 수 있는 상태이며,
기존 128개 앱을 임의로 감시 활성화하거나 새로운 공식 확인을 만들어 넣지 않았다.

실행 방법은 [수집·검토 운영 안내](collection-operations.md), 환경 경계는 [환경 안내](environments.md)에 있다.
006의 실제 Supabase Auth/SQL/TLS·Preview/Production 분리·운영 스케줄러·Vercel 배포·도메인·출시 검증,
실제 콘텐츠의 사람 검토와 공개 승인·자산 권리 검토는 별도다. 외부 프로젝트 생성·배포·푸시는 수행하지 않았다.

## 006 — hosted transfer and final environment scope (2026-10-29)

- Final user decision: local development + one Production environment. Existing Supabase/Vercel projects renamed is-duo-ready; no second hosted DB or paid upgrade. Preview variables removed and the same verified server secrets/configuration moved to Production only. Private config is .env.hosted.production.local, outside Next automatic env loading.
- All five remote migration checksums matched. Actual DB authentication passed after user password correction. Official Supabase CA/hostname verification and provider SSL enforcement passed; pg_stat_ssl=true.
- Actual128 app drafts,128 icon metadata,22 sources/evidence/support records and44 translations transferred. All16 allowlisted table hashes matched; repeat apply returned identical. All128 icon originals copied/downloaded with byte/hash equality; no local data removed and no app published.
- Provider verification passed: getUser of exact access token, refresh, logout/replayed-session denial, ordinary/admin/revoked/anon RLS and private bucket public-URL denial. Disposable identity removed; auth/admin counts returned0. These checks are not a deployed browser test.
- Lint/typecheck passed; unit53 passed including hosted storage/session/TLS/env isolation; DB15 passed. Public fixture E2E15 passed. Admin E2E first run30/37 passed with7 timing/worker failures during a prolonged run; those7 passed on a fresh isolated rerun (49.5s). Do not describe the first full run as clean.
- Default npm run build hit a local Turbopack internal-port permission failure both normally and with escalation. Official npm run build -- --webpack passed. Production fixture/local-login/development-image guards and production DB public/private checks passed.
- Explicit first Preview request was classified by Vercel as Production; env:check rejected missing Production configuration before app launch. Static preparation-only first Production registration was separately approved and succeeded. Unexpected generated alias was removed. Actual app deployment was not performed after the user canceled the separate Preview architecture.
- Readiness report deliberately exits1: published0, category gaps65, human-review gaps128, evidence/bilingual-summary gaps106, icon gaps0. Permanent hosted admin, actual application deployment/browser verification and content review remain open.

## Open-source publication preparation (2026-10-29)

User explicitly requested a public GitHub repository. Original code uses MIT; third-party notices and Spec Kit/VoltAgent licenses are preserved. Added contribution/security/issue/PR guidance and read-only CI with pinned official action commits. Local envs, DB/icon exports, working imports, deployment metadata and unapproved device render are excluded from Git. Fresh clones omit the optional render without showing a broken image. Public-repository and CI outcomes are recorded after upload.

### Publication outcome

- Published [yono92/is-duo-ready](https://github.com/yono92/is-duo-ready) as a public repository on `main`; initial commit `b9b1af3a869d4fbd83f177798fab6789a5e052a7`. GitHub recognizes the MIT license. Issues, Discussions and private vulnerability reporting are enabled.
- Audited all 279 staged files before upload, including comparisons against actual configured hosted credentials: no secret matches or excluded operational files were staged. App data, original icons, private environment files and deployment records remain outside Git.
- [First GitHub CI run](https://github.com/yono92/is-duo-ready/actions/runs/40855538941): dependency installation, lint, TypeScript, 53 unit tests, database setup/migrations and 15 DB integration tests passed. Browser suite: 31/37 passed, 6 failed. One import accessibility case reported an empty document title; four public-data locale/theme cases reported horizontal overflow; one review/alias case matched duplicate review text. These failures remain unresolved in the published initial commit.
- Subsequent fixture E2E, build and production checks were skipped after the browser failure. Do not treat this run as a passing release gate. Local UI edits made after the initial commit are outside that CI result and are not included in this publication-record update.
- Repository publication did not connect Vercel Git deployment or deploy the actual application.

## 2026-10-29 — TypeScript consolidation and public tooling cleanup

- User requested TypeScript for authored JavaScript and removal of Spec Kit from the public repository. Converted 45 `.mjs` files to `.ts` (application/server modules, command-line tools, integration tests, preload and ESLint config); replaced the static PostCSS module with JSON. No authored JS or Shell files remain tracked. Added pinned `tsx`/`jiti`, explicit input/output and DB callback/query types, and disabled `allowJs`; strict checking now covers scripts and integration tests too. No `@ts-nocheck`, implicit-any exemption or test exclusion was used.
- Removed `.specify/` and `.agents/` from Git tracking, retaining the local ignored files. Preserved authored feature documents and moved the current engineering principles to `docs/engineering-principles.md`; updated contributor references. Kept upstream license notices for template-derived documents and earlier history.
- SQL migration contents and their checksums are unchanged. `docs/database-architecture.md` distinguishes normal SQL/PLpgSQL usage from this project's custom migration runner/history and database workflow choices. No hosted DB writes, schema changes or application deployment were performed.
- Working tree lint/typecheck and 53 unit tests passed; isolated local DB integration 15/15 passed. A clean copy of the staged public source (excluding concurrent UI work) passed `npm ci`, lint/typecheck, 53 unit tests, default `npm run build` (Turbopack), production fixture/auth/image guards, production public/private DB checks, and public fixture E2E 15/15. Build retains four existing dynamic local-icon filesystem tracing warnings.
- First administrator run timed out before server startup: inheriting the `tsx` loader globally stalled Next dev re-execution. The CLI keeps explicit `node --import tsx`; the test-only Next preload uses Node 22.14's `--experimental-strip-types`. That repaired startup. The subsequent full suite passed35/37; two tests matched hidden prior-route DOM. Scoped those selectors to the visible main landmark, then reran the entire icon/public-data group:7/7 passed (including both failed cases). Do not label the earlier full run a clean37/37.
- Publication is limited to this refactor, tooling removal, associated test adjustments and documentation. Concurrent UI changes are preserved separately in the working tree. GitHub CI results, if still pending, are not inferred from local checks.
