# Astryx 전수검사 — 2026-10-30

**최신 재검사:** [astryx-reaudit.md](astryx-reaudit.md). 교체 후 TSX 57개를 재검사했고,
추가 미교체는 없었으나 TextArea 길이 검증 계약 1건과 CSV 선택의 간헐적 E2E timeout을 기록했다.
아래는 최초 검사와 교체 당시의 기록이다.

최초 검사 기준 시각: 09:59 KST. **7개 확정 적용 문제와 1개 간헐적 키보드 문제를 확인했다.**
아래 최초 검사 기록은 당시 상태이며, 후속 사용자 요청으로 A01–A07을 실제 컴포넌트로 교체했다.

## 후속 요청 반영 — 전체 교체

| 항목 | 반영 내용 |
| --- | --- |
| A01 | 오류 토큰을 실제 `--color-error`에 연결; 가져오기 오류 색상을 양 테마 E2E에서 확인 |
| A02 | Button에 `isLoading` 전달; 폼·가져오기·새로고침 9개 위치의 busy와 disabled 분리; 중지는 계속 활성 |
| A03 | 실제 TopNav/TopNavItem으로 관리자 메뉴를 구성; 중첩 경로의 가장 구체적인 섹션 한 개 선택 |
| A04 | 빈 결과 5개 분기를 실제 EmptyState로 교체 |
| A05 | 알림 7곳과 로컬 인증 안내를 실제 Banner로 교체; 접수 완료 h2와 live region 유지 |
| A06 | `hasMore={hasNext}`인 실제 Pagination 사용; state 쿼리와 이전/다음 경계 보존; DB 변경 없음 |
| A07 | 브랜드·공식 배지·스킵 링크 모두 실제 Link로 교체; 해시는 Astryx의 native anchor 렌더러로 처리 |

추가로 부드러운 스크롤은 해시 탐색 링크에 초점이 있을 때만 적용한다. 전체 smooth scroll이
폼·필터 초점 이동까지 애니메이션하면서 선택 팝오버의 앵커가 이동하던 충돌을 수정했다.
해시 링크는 locale Link가 가로채지 않도록 실제 Astryx Link의 `as='a'`를 사용한다.
첫 Tab → 스킵 → 본문 → 다음 Tab의 접근 순서를 실제 브라우저에서 확인했다.

**A06 최초 설명 정정:** 설치된 0.7.4 Pagination은 이미 totalPages 없이 `hasMore`를 지원한다.
최초 검사에서 이 optional API를 놓쳤다. 따라서 임의의 전체 수나 새 COUNT 조회가 필요하지 않다.

최종 정적 재검사 대상은 병행 통계 차트 파일과 AdminNavigation을 포함한 TSX **57개**다.
native a/button/select/textarea/dialog/details/progress는 남지 않았고, 직접 작성된 input 5곳은
기존 hidden 서버 데이터 4곳과 숨겨진 honeypot 1곳뿐이다. 일반 의미 구조와 전용 3D 조작은 유지한다.
지원 통계의 Recharts는 병행 사용자 선택을 기록한 현재 DESIGN.md의 명시적 차트 예외이며,
툴팁 표면은 실제 Astryx Card다. 다른 작업의 의존성/차트 변경을 이 교체의 성과로 집계하지 않는다.

A08의 언어 메뉴는 처음부터 실제 DropdownMenu다. 별도 반복 5회 및 교체 후 전체 공개 검사에서
통과했으나 원인을 특정하는 앱/라이브러리 수정을 하지 않았으므로 해결됐다고 선언하지 않는다.
최종 명령별 결과와 중간 실패/수정 이력은 `docs/verification.md`에 기록한다. 배포는 하지 않았다.

## 최초 검사 기록

## 범위와 기준

- `src`의 TSX 54개 전체를 TypeScript AST로 열거하고 import, JSX, native control,
  역할 및 이벤트를 대조했다. 검사 중 병행 작업으로 추가된 `support-distribution.tsx`도
  추가 검토하여 최종 **55개**를 포함했다. 공통 CSS, provider, 메시지, 의존성,
  `useFormValue` 및 공개/관리자 E2E도 검토했다.
- AGENTS.md, DESIGN.md, PRD, engineering-principles 및 001의 최신 Apple/Astryx 지침을
  우선했다. 과거 Neutral-only 또는 native select 유지 계획을 현재 요구사항으로 삼지 않았다.
- 설치된 `@astryxdesign/core`/`theme-neutral` **0.7.4**의 실제 소스·타입·CSS를 기준으로
  판정했다. 웹의 최신 API가 설치 버전과 같다고 가정하지 않았다.
- CSS import와 layer, className을 통한 스타일링 및 테마 사용자화 자체는 정상이다.
  [공식 styling 문서](https://astryx.atmeta.com/docs/styling-overview)와
  [공식 theme 문서](https://astryx.atmeta.com/docs/theme)도 대조했다.
  프로젝트의 자체 Tailwind 토큰 매핑은 공식 bridge를 대신하는 방식이므로,
  bridge import가 없다는 사실 자체를 결함으로 세지 않았다.
- 아래 P2는 수정할 사용/기능 문제, P3는 전체 적용 기준의 일관성 문제다.
  P3를 접근성 오류나 기능 고장으로 과장하지 않는다.

## 확정된 문제

### A01 · P2 · 존재하지 않는 오류 색상 토큰

`src/app/globals.css:30`은 `--color-destructive: var(--color-text-error)`를 사용한다.
설치 버전의 오류 토큰은 `--color-error`이고 `--color-text-error`는 정의돼 있지 않다.
영향 위치는 `src/components/admin/import-form.tsx:171`의 행 오류와
`src/components/operations/collection-dashboard.tsx:155`의 수집 오류다.

브라우저에서 원인 토큰 값은 빈 문자열이었다. 실제 생성된 `text-destructive` 클래스를
임시 DOM 요소로 검사하니 라이트 모드에서 `rgb(29, 29, 31)`로 본문색과 같았고,
유효한 `--color-error`는 `#76000c`였다. 임시 요소는 검사 직후 제거했다.
유효한 토큰으로 연결하고 두 실제 오류 상태의 양 테마를 확인해야 한다.

### A02 · P2 · 공통 Button이 Astryx 로딩 API를 노출하지 않음

`src/components/ui/button.tsx:8,36–44`는 native button props를 받고 `disabled`를
`isDisabled`로만 변환한다. `isLoading`은 타입과 전달 경로 모두 없다.
`login-form.tsx:38`, `edit-form.tsx:361,403`, `import-form.tsx:72,128,143`,
`operation-form.tsx:48`, `submission-form.tsx:87`, `collection-dashboard.tsx:61`은
진행 중 상태를 disabled와 별도 문구 변경으로 표현한다.

실제 Astryx Button은 `isLoading`으로 spinner, `aria-busy`, 로딩 live region,
중복 실행 방지 및 busy 상태의 초점 보존을 처리한다. 현재 구현에서는 이 동작이
활성화되지 않는다. 작업 중 상태와 실제 사용 불가 상태를 각각 매핑해야 한다.
가져오기 중지 버튼은 진행 중에도 눌러야 하므로 일괄 disabled 처리하면 안 된다.

### A03 · P2 · 관리자 TopNavItem의 현재 위치 상태 누락

`src/app/[locale]/admin/(protected)/layout.tsx:17–22`의 항목 6개에
`isSelected`가 없다. 실제 Astryx 컴포넌트를 쓰지만 모든 항목이 기본 false여서
현재 섹션 강조와 `aria-current="page"`를 제공하지 않는다.
공개 `site-navigation.tsx`는 현재 pathname을 비교하고 있어 두 영역의 적용이 다르다.
앱 생성/편집, import, 검토 상세 등 중첩 경로까지 현재 섹션을 판정해야 한다.

### A04 · P3 · EmptyState 적용 누락 — 5개 분기

| 위치 | 현재 표현 |
| --- | --- |
| `src/app/[locale]/updates/page.tsx:40–41` | Card + 빈 결과 문단 |
| `src/app/[locale]/admin/(protected)/apps/page.tsx:57` | 빈 앱 목록 문단 |
| `src/components/operations/review-list.tsx:66` | 빈 검토/제보 목록 문단 |
| `src/components/operations/collection-dashboard.tsx:183` | 빈 수집 대상 문단 |
| `src/components/operations/collection-dashboard.tsx:203` | 빈 실행 이력 문단 |

DESIGN.md는 빈 결과에 실제 EmptyState를 지정한다. 홈 두 분기는 정상 적용돼 있으나
위 다섯 분기는 빠져 있다. 상세 페이지에서 개별 필드나 근거의 부재를 설명하는 본문까지
모두 EmptyState로 바꿔야 한다는 뜻은 아니다.

### A05 · P3 · 알림을 Banner 대신 문단/일반 Card로 표현

| 위치 | 상태 |
| --- | --- |
| `src/components/operations/submission-form.tsx:22` | 접수 완료: Card |
| `src/components/operations/submission-form.tsx:83` | 제보 사용 불가: 문단 |
| `src/components/operations/operation-form.tsx:44` | 작업 성공: 문단 |
| `src/components/operations/collection-dashboard.tsx:150` | 장기 수집 실패: 문단 |
| `src/components/operations/collection-dashboard.tsx:155` | 마지막 수집 오류: 문단 |
| `src/app/[locale]/admin/(protected)/apps/[id]/page.tsx:50` | 저장/검토 완료: Card |
| `src/app/[locale]/admin/login/page.tsx:29` | 인증 사용 불가: 문단 |

여러 위치에 `role="status"`가 있어 알림 의미 자체가 모두 사라진 것은 아니다.
다만 DESIGN.md의 Banner 적용과 의미색·아이콘 표현이 일관되지 않는다.
기존 폼 오류 Banner 사용은 정상이다. 일반 설명, 목록의 항목별 오류 문구,
정적 상태명은 무조건 Banner로 바꿀 대상으로 세지 않았다.

### A06 · P3 · 검토/제보 페이지 이동은 자체 링크 조합

`src/components/operations/review-list.tsx:67–78`은 nav + 이전/다음 Link를 직접 구성한다.
각 Link 자체는 실제 Astryx다. 그러나 DESIGN.md에서 지정한 Pagination을 사용하지 않아
홈 및 updates의 페이지 이동과 다르다. 현재 목록 API는 전체 페이지 수 없이 `hasNext`를
반환하므로 단순히 가짜 totalPages를 만들어 교체하면 안 된다. 실제 API 계약에 맞는
Astryx Pagination 구성 또는 명시적 예외를 설계해야 한다. state 쿼리를 보존해야 한다.

### A07 · P3 · 일반 링크 2곳이 Astryx를 우회

- `src/components/site-navigation.tsx:3,13`: 브랜드 홈 링크가 next-intl Link 직접 사용.
- `src/components/app-store-badge.tsx:7`: 스토어 이미지 링크가 native a 직접 사용.

라우팅용 LinkProvider의 next-intl Link나 Button의 `as={Link}`는 정상적인 어댑터여서
이 문제에 포함하지 않는다. 위 두 곳은 보이는 일반 링크의 최종 위젯이 Astryx가 아니다.
직접 작성된 초점 CSS가 있으므로 이를 곧바로 키보드 접근 불가라고 판정하지 않는다.
`header.tsx:7`의 native skip link는 별도 접근성 장치로 따로 기록한다. 교체 여부와 무관하게
첫 Tab 노출·해시 이동·초점·고정 위치를 보존해야 한다.

## 재현됐지만 원인 미확정

### A08 · P2 · 언어 DropdownMenu의 간헐적 키보드 실패

소비 위치는 `src/components/preferences.tsx:37–58`, 검증 위치는
`tests/e2e/directory.spec.ts:296–320`이다.

- 공개 전체 E2E에서 Enter 열기 → Escape 닫기 → ArrowDown 다시 열기 뒤
  한국어 menuitemradio가 초점을 받지 않아 실패했다 (`:314`).
- 같은 기존 테스트를 단일 worker로 3회 실행하니 2회 통과, 1회 실패했다.
  이 실패는 첫 항목 초점 검사를 통과한 뒤 Home → Enter에도 `/en`에 남았다 (`:317`).
- 총 4회 실행 중 2회 실패했다. 항상 실패하는 문제라고 단정하지 않는다.
- Astryx 0.7.4 내부에는 deferred focus 및 닫기/초점 복귀 처리가 있다.
  앱의 옵션 구성 잘못, 라이브러리 경합, 테스트의 빠른 재열기/키 입력 중 무엇이 원인인지는
  아직 분리하지 못했다. 임의 timeout으로 덮거나 테스트를 삭제하지 말고 trace로 조사해야 한다.

Trace:

- `test-results/fixtures-3381/directory-language-menu-st-c52a2--keyboard-and-returns-focus-chromium/trace.zip`
- `test-results/fixtures-3383/directory-language-menu-st-c52a2--keyboard-and-returns-focus-chromium-repeat1/trace.zip`

## 정상 적용과 의도된 HTML

- TextInput/TextArea/Selector/CheckboxInput/DateInput/FileInput은 모두 실제 Astryx다.
  공개용 native select/textarea/button/dialog/details/progress 구현은 없었다.
  검색과 URL 입력은 TextInput의 지원 type에 맞춰 role/inputMode/pattern으로 연결한다.
  TextInput/TextArea의 native required, 이름, controlled value, change event 전달과
  Checkbox의 native required를 설치 소스로 확인했다. Selector의 isRequired는 ARIA 표시이며
  native required 검증과 같다고 주장하지 않는다. 현재 필수 앱 선택은 기본값/서버 검증을 쓴다.
- native input 5개 JSX 위치 중 4개는 hidden payload/id/revision/operation 데이터,
  나머지 1개는 숨겨진 honeypot이다. 허용된 예외다. map 실행 횟수와 JSX 위치 수는 다르다.
- 실제 Card/ClickableCard, Collapsible, Banner, ProgressBar, EmptyState, Pagination,
  Badge, Skeleton, Switch, DropdownMenu, Dialog, TopNavItem/SideNavItem 경로를 확인했다.
- ClickableCard는 숨겨진 실제 링크와 nested interactive element를 지원한다.
  AppStoreBadge를 포함했다는 이유로 nested anchor 결함을 잘못 보고하지 않았다.
- Theme/InternationalizationProvider/LinkProvider, ko-KR catalog, next-themes 및
  reset/core/theme CSS와 layer 순서는 정상이다. Apple 토큰·pill 버튼은 최신 디자인 지시다.
  Radix/shadcn 위젯 의존성이나 소스 import는 남아 있지 않았다.
- form/fieldset/legend, 제목·설명·목록·dl, 브랜드/앱 이미지, OG ImageResponse,
  R3F 장면·shader는 자체 콘텐츠/의미 구조이며 일반 위젯 누락이 아니다.
  기기 가장자리 role=slider는 DESIGN.md에 명시된 전용 3D 조작 예외다.
- 병행 작업에서 추가된 VegaChart는 실제 `@astryxdesign/vega`였다. 설치 버전은
  `0.7.5-canary.70ea859`로 정확히 고정돼 있고 peer 요구사항도 충족한다. 안정판 core와
  버전 문자열이 다르다는 이유만으로 호환성 오류로 판정하지 않았다. 해당 패키지는 자체
  stylesheet를 배포하지 않으므로 vega.css 누락도 아니다. 최신 브라우저에서 실제 SVG와
  네 데이터 색상 토큰 해석을 확인했다. canary 의존성과 후속 회귀 검증은 병행 작업 범위다.
  중간 버전의 `description: {expr: ...}`에서 Vega-Lite가 해당 채널을 버린다는 경고도
  관찰했다. 최종 소스 재확인에서는 병행 작업이 calculate 변환 + description field로
  변경해 둔 상태였다. 이 중간 상태를 현재 미해결 결함 수에 포함하지 않는다.

## 검증 결과와 한계

| 명령 | 결과 |
| --- | --- |
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm test` | 18파일, 89개 통과 |
| `DUO_TEST_PORT=3381 npm run test:e2e` | 29 통과, 언어 메뉴 1 실패 |
| `DUO_TEST_PORT=3383 npm run test:e2e -- --grep 'language menu' --repeat-each=3 --workers=1` | 2 통과, 1 실패 |
| `DUO_TEST_PORT=3382 npm run test:admin` | 격리 임시 DB에서 39개 통과, 종료 코드 0 |
| `npm run build` | 기본 Turbopack CSS 포트 바인딩 EPERM으로 실패; 권한 재시도도 동일 |
| `npm run build -- --webpack` | 컴파일·타입·정적 페이지 생성 통과 |

샌드박스의 첫 공개 E2E/관리자 DB 실행도 포트·접근 EPERM으로 시작하지 못했다.
실행 권한을 확보한 뒤 위 결과를 얻었다. 승인 거절은 없었다.
관리자 검증은 파일·날짜·체크·저장·검토·공개 및 ko/en·테마 접근성 흐름을 포함한다.
공개 검증은 360/768/1440px, 모달, 테마, URL, 언어, reduced motion/3D 흐름을 포함한다.
Chromium 검증이며 Safari/Firefox 결과나 운영 배포 결과로 확대하지 않는다.

**검사 도중 다른 작업이 통계 UI와 의존성을 변경했다.** 표의 전체 검사/빌드 결과는 각각의
실행 시점 기준이다. 새 Vega 파일의 추가 정적 검토와 실제 SVG 확인은 수행했으나,
이 기록을 그 병행 변경의 전체 회귀 통과로 해석하면 안 된다.
알려진 문제를 수정하지 않았으므로 기존 T040/T041의 완료 표시만으로 현재 전 화면의
Astryx 적용이 완전하다고 보고할 수 없다. 후속 작업은 001 작업 목록에 미완료로 남긴다.

## 전체 파일 확인표

아래 표의 “별도 지적 없음”은 추가 Astryx 적용 결함을 발견하지 않았다는 뜻이며,
모든 제품 기능과 모든 브라우저에 결함이 없음을 보증하지 않는다.

| 파일 | 사용/위임 컴포넌트 | 판정 |
| --- | --- | --- |
| `src/app/[locale]/[section]/page.tsx` | Link, ArrowLeft | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/[id]/page.tsx` | AppIcon, AppStoreBadge, Card, EditForm, Link, ReviewForm | A05 |
| `src/app/[locale]/admin/(protected)/apps/import/page.tsx` | ImportProgress, Link, ImportForm | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/new/page.tsx` | EditForm | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/page.tsx` | Link, Input, Button, Card, AppIcon, AppStoreBadge | A04 |
| `src/app/[locale]/admin/(protected)/collections/page.tsx` | AdminQueryProvider, CollectionDashboard | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/layout.tsx` | TopNavItem, Button, Card | A03 |
| `src/app/[locale]/admin/(protected)/page.tsx` | Card, Link | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/reviews/[id]/page.tsx` | Link, Card, Collapsible, OperationForm, Select, TextArea, Checkbox | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/reviews/page.tsx` | ReviewList | 별도 지적 없음 |
| `src/app/[locale]/admin/(protected)/submissions/page.tsx` | ReviewList | 별도 지적 없음 |
| `src/app/[locale]/admin/layout.tsx` | re-export / 메타데이터 / 자체 콘텐츠 | 별도 지적 없음 |
| `src/app/[locale]/admin/login/page.tsx` | Card, Banner, LoginForm | A05 |
| `src/app/[locale]/apps/[slug]/page.tsx` | Link, ArrowLeft, FixtureNotice, AppIcon, StatusBadge, AppStoreBadge, Card, HistoryList | 별도 지적 없음 |
| `src/app/[locale]/error.tsx` | Button | 별도 지적 없음 |
| `src/app/[locale]/layout.tsx` | NextIntlClientProvider, Providers, Header, Link | 별도 지적 없음 |
| `src/app/[locale]/loading.tsx` | Skeleton | 별도 지적 없음 |
| `src/app/[locale]/not-found.tsx` | ButtonLink | 별도 지적 없음 |
| `src/app/[locale]/page.tsx` | ButtonLink, Link, ArrowRight, DevicePreview, Globe2, FixtureNotice, DirectoryOverview, DirectoryControls, Fragment, AppCard, Card, EmptyState, SearchX | 별도 지적 없음 |
| `src/app/[locale]/submit/page.tsx` | Link, SubmissionForm | 별도 지적 없음 |
| `src/app/[locale]/updates/page.tsx` | HistoryList, Card, RoutePagination | A04 |
| `src/app/api/og/[locale]/route.tsx` | re-export / 메타데이터 / 자체 콘텐츠 | 별도 지적 없음 |
| `src/components/admin/edit-form.tsx` | Input, Card, Select, TextArea, Button, DateInput, Checkbox, Banner | A02 |
| `src/components/admin/import-form.tsx` | ImportProgress, Select, TextArea, FileInput, Banner, Button, ProgressBar, Link, Card | A01, A02 |
| `src/components/admin/login-form.tsx` | Input, Banner, Button | A02 |
| `src/components/admin/query-provider.tsx` | QueryClientProvider | 별도 지적 없음 |
| `src/components/app-icon.tsx` | Image, Icon | 별도 지적 없음 |
| `src/components/app-store-badge.tsx` | Image | A07 |
| `src/components/brand-mark.tsx` | Image | 별도 지적 없음 |
| `src/components/device-preview.tsx` | Image, DeviceScene, Button, RotateCcw | 별도 지적 없음 |
| `src/components/device-scene.tsx` | DeviceScreenMaterial, RoundedBox, CameraLens, Panel, Environment, Lightformer, RenderBoundary, Canvas, Suspense, StudioEnvironment, Model | 별도 지적 없음 |
| `src/components/device-screen-material.tsx` | re-export / 메타데이터 / 자체 콘텐츠 | 별도 지적 없음 |
| `src/components/directory/app-card.tsx` | ClickableCard, AppIcon, ArrowUpRight, StatusBadge, AppStoreBadge | 별도 지적 없음 |
| `src/components/directory/controls.tsx` | SideNavItem, Select, Input, Search, Button, SlidersHorizontal, Dialog, DialogHeader, X, Link, Pagination | 별도 지적 없음 |
| `src/components/directory/history-list.tsx` | Card, Link | 별도 지적 없음 |
| `src/components/directory/stats.tsx` | SupportDistribution, Icon | 별도 지적 없음 |
| `src/components/directory/support-distribution.tsx` | VegaChart | 병행 추가; 실제 VegaChart/SVG 확인 |
| `src/components/fixture-notice.tsx` | Banner, FlaskConical | 별도 지적 없음 |
| `src/components/header.tsx` | SiteNavigation | 특수 skip link 검토 기록 |
| `src/components/operations/collection-dashboard.tsx` | Banner, Link, Button, Card, Collapsible, OperationForm, Select, Input, Checkbox | A01, A02, A04, A05 |
| `src/components/operations/operation-form.tsx` | Banner, Button | A02, A05 |
| `src/components/operations/review-list.tsx` | TopNavItem, ClickableCard, Link | A04, A06 |
| `src/components/operations/submission-form.tsx` | Card, Select, Input, TextArea, Banner, Button | A02, A05 |
| `src/components/preferences.tsx` | DropdownMenu, Globe2, DropdownMenuRadioGroup, DropdownMenuRadioItem, Switch | A08 원인 조사 |
| `src/components/providers.tsx` | InternationalizationProvider, Theme, LinkProvider, ThemeProvider, AstryxProvider | 별도 지적 없음 |
| `src/components/site-navigation.tsx` | Link, BrandMark, TopNav, TopNavItem, Preferences | A07 |
| `src/components/status-badge.tsx` | Badge, Icon | 별도 지적 없음 |
| `src/components/ui/badge.tsx` | re-export / 메타데이터 / 자체 콘텐츠 | 별도 지적 없음 |
| `src/components/ui/button.tsx` | AstryxButton | A02 |
| `src/components/ui/form-controls.tsx` | Selector, AstryxTextArea, CheckboxInput | 별도 지적 없음 |
| `src/components/ui/input.tsx` | TextInput | 별도 지적 없음 |
| `src/components/ui/link.tsx` | AstryxLink | 별도 지적 없음 |
| `src/components/ui/route-pagination.tsx` | Pagination | 별도 지적 없음 |
| `src/components/ui/skeleton.tsx` | re-export / 메타데이터 / 자체 콘텐츠 | 별도 지적 없음 |
| `src/components/ui/surfaces.tsx` | re-export / 메타데이터 / 자체 콘텐츠 | 별도 지적 없음 |
