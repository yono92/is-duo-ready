# Astryx 재전수검사 — 2026-10-30

**추가 미교체 위젯 0종, 새로 확인한 검증 계약 문제 1건, 원인 미확정 E2E 실패 1건.**
검사 기준은 설치된 Astryx core/theme-neutral 0.7.4와 현재 DESIGN.md다.
HEAD는 `15cb021`이며, 작업 중인 변경까지 포함한 로컬 소스를 검사했다.
이번 재검사에서는 제품 구현을 수정하지 않았다. 이전 교체의 정상 여부와 새 문제를 분리해 기록한다.

## 범위

- TSX 57개 전체를 AST로 다시 열거해 import·위젯·native interactive JSX를 확인했다.
  공통 래퍼·provider·CSS·폼 reset bridge·호출부와 설치 패키지 소스도 대조했다.
- 자체 TSX/CSS 61개에서 참조한 CSS 변수를 core/theme CSS 정의와 대조했다.
  미정의 변수는 fallback이 있는 `--font-size-body-md`뿐이며, 오류 의미색처럼 값이
  무효가 되는 새 토큰 참조는 발견하지 않았다.
- 공개/관리자 전체 E2E, 새 busy·관리자 메뉴·hasMore·skip 회귀 검사, 언어 메뉴 반복,
  실패 시나리오 반복, 실제 래퍼 SSR 마크업의 브라우저 검증을 수행했다.
- 파일별 AST 확인표는 이 문서 끝에 있다. 상세 기계 판독 목록과 검사 중 브라우저 기록은
  `test-results/astryx-reaudit/`에 보존한다.

## R01 · P2 · TextArea maxLength의 의미가 native 폼 계약과 다름

**위치:** `src/components/ui/form-controls.tsx:56–93`, 특히 실제 컴포넌트에 props를
그대로 전달하는 `:78–79`.

이 래퍼는 `ComponentProps<'textarea'>`를 받아 native 속성처럼 보이지만,
Astryx TextArea의 `maxLength`는 **사용자 인식 문자(grapheme) 수를 세는 소프트 제한**이다.
설치 소스 `node_modules/@astryxdesign/core/src/TextArea/TextArea.tsx:328–337`도
native 제한을 적용하지 않고 소비자가 검증해야 한다고 명시한다.
실제 `<textarea>`에 maxlength가 없고 초과 시 counter/aria-invalid만 달라진다.
이것은 Astryx 자체의 잘못된 API 동작이 아니라 소비 래퍼의 계약 보완 누락이다.

### 재현

실제 로컬 TextArea 래퍼를 `renderToStaticMarkup`으로 렌더링해 독립 Chromium 문서에
올렸다. native textarea 대조군도 같은 required/minlength/maxlength=4000으로 배치했다.
4000자를 채우고 키보드로 1자를 더 입력한 결과:

| 관찰 | 실제 Astryx 래퍼의 SSR 마크업 | native 대조군 |
| --- | --- | --- |
| 입력된 문자 수 | 4001 | 4000 |
| DOM `maxLength` | -1 (속성 없음) | 4000 |
| `validity.tooLong` | false | false (추가 입력 자체가 차단됨) |
| `form.checkValidity()` | true | true |

이 대조 실험은 **SSR로 생성된 실제 native 속성**을 검사한 것이다. React hydration 후의
counter 갱신까지 재현했다고 주장하지 않는다. 실제 client 소스도 초과 상태를 ARIA/counter로
표시할 뿐 native custom validity나 제출 차단을 설정하지 않는 것을 별도로 확인했다.
현재 소비 래퍼의 onChange도 값 갱신/이벤트 전달만 수행한다.

### 영향 범위 — TextArea 호출 8곳

| 파일·행 | 필드 | 전달한 maxLength |
| --- | --- | --- |
| `src/components/admin/edit-form.tsx:155` | 번역 요약 | 4000 |
| `src/components/admin/edit-form.tsx:200` | 추가 확인 사유 | 4000 |
| `src/components/admin/edit-form.tsx:209` | 릴리스 노트 | 20000 |
| `src/components/admin/edit-form.tsx:275` | 근거 인용 | 4000 |
| `src/components/admin/edit-form.tsx:393` | 검토 사유 | 4000 |
| `src/components/admin/import-form.tsx:49` | 가져오기 원문 | 524288 |
| `src/components/operations/submission-form.tsx:62` | 제보 본문 | 4000 |
| `src/app/[locale]/admin/(protected)/reviews/[id]/page.tsx:240` | 결정 사유 | 4000 |

서버 검증은 유지된다. `src/lib/admin/input.ts:68–69`는 JS `value.length`로,
`src/lib/operations/input.ts:17`은 제보 본문 길이로 초과를 거부한다.
`src/lib/import/input.ts:73`은 UTF-8 byte 길이를 검사한다.
따라서 데이터 제한을 우회하는 보안 문제로 판정하지 않는다. 사용자에게 길이 초과 입력을
허용하고 서버 오류로 늦게 돌려보내는 클라이언트 계약 문제다.

추가로 grapheme·UTF-16 code unit·UTF-8 byte가 서로 다르므로, counter 안에서는 허용으로
보이는 이모지/결합 문자나 가져오기 원문도 서버에서 초과가 될 수 있다.
후속 수정에서는 각 필드의 길이 단위를 명확히 하고, 실제 Astryx를 유지하면서 소비자 검증·
안내·서버 계약을 일치시켜야 한다. 단순한 임의 문자열 자르기나 서버 제한 완화로 처리하면 안 된다.

## R02 · P2 · 관리자 CSV 선택 E2E가 간헐적으로 완료되지 않음

**검증 위치:** `tests/e2e/import.spec.ts:25`, `tests/e2e/select-option.ts`.
**UI 경로:** 입력 방식 Selector → CSV option 선택.

- 관리자 전체 실행은 **41 통과·1 실패**였다. 실패는 `en light 768`에서 60초 timeout이었다.
- trace의 마지막 사용자 동작은 입력 방식 combobox 열기, CSV option 표시 확인,
  CSV option 클릭이다. 클릭이 완료됐다는 기록 없이 테스트 기한에 도달했다.
- 같은 시나리오를 별도 임시 DB로 3회 반복한 결과 **3회 모두 통과**했다.
- 이 결과만으로 앱의 Selector 설정 오류, 라이브러리 경합, 브라우저/GPU 자원 경합 중
  원인을 확정하지 않는다. 강제 클릭·timeout 증가·검사 삭제로 숨기지 않았다.
- 이전 교체 작업의 단일 전체 통과를 안정성 보장으로 확대해서는 안 된다.

Trace: `test-results/admin-3412/import-import-CSV-replay-e-cfca2-ew-and-publish-en-light-768-chromium/trace.zip`.

## 기존 A01–A07 재확인

| 항목 | 재검사 결과 |
| --- | --- |
| 오류 토큰 | 유효한 `--color-error` 연결 유지; 양 테마 가져오기 오류 색상 검사 통과 |
| Button loading | isLoading 전달 유지; busy 초점·중복 활성화 차단 검사 통과 |
| 관리자 탐색 | 실제 TopNav/TopNavItem; 중첩 경로 선택·360px 줄바꿈 검사 통과 |
| 빈 결과 | 앞서 지적한 5개 분기 모두 실제 EmptyState 유지 |
| 알림 | 성공·사용 불가·장기 실패·로컬 안내의 실제 Banner 적용 유지 |
| 페이지 이동 | 실제 Pagination hasMore와 state 보존; 두 큐의 이전/다음 경계 검사 통과 |
| 링크 | 브랜드·공식 배지·skip 모두 실제 Link; native hash 렌더러와 Tab 순서 검사 통과 |

native a/button/select/textarea/dialog/details/progress JSX는 애플리케이션 소스에 없다.
직접 작성한 input 5개 위치는 hidden payload/id/revision/operation 4개와 숨겨진 honeypot 1개다.
일반 form/fieldset/legend·제목·설명·목록, 이미지와 OG 렌더링, DESIGN.md의 전용 3D 핸들은
정상적인 의미 구조/콘텐츠 또는 명시적 예외다. Recharts 통계 차트도 현재 DESIGN.md/PRD의
사용자 선택 예외이며 툴팁 표면은 실제 Astryx Card다.
Radix/shadcn/MUI/Chakra/Headless UI 위젯 import는 발견하지 않았다.

Select의 `isRequired`는 native required와 같지 않지만 현재 필수 앱 선택은 유효한 기본값을
갖거나 앱이 없을 때 제출이 disabled다. 이를 새로 재현된 사용자 결함으로 세지 않았다.
현재 호출하지 않는 래퍼 옵션의 일반적인 확장성 제한도 확정 문제로 세지 않았다.

## 기존 A08 언어 메뉴

현재도 실제 DropdownMenu/RadioGroup/RadioItem을 사용한다.
공개 전체 검사와 별도 키보드 반복 **10회 모두 통과**했다.
하지만 과거 간헐적 실패의 원인을 특정하는 수정을 하지 않았으므로 T064는 미완료로 유지한다.
CSV 선택 timeout과 같은 원인이라고 단정하지 않는다.

## 명령별 결과

| 명령 | 결과 |
| --- | --- |
| `npm run lint` | 통과 |
| `npm run typecheck` | 통과 |
| `npm test` | 18파일·89개 통과 |
| `DUO_TEST_PORT=3411 npm run test:e2e -- --workers=1` | 32개 통과, 2.2분 |
| `DUO_TEST_PORT=3412 npm run test:admin` | 41 통과·1 실패, 4.2분 |
| `DUO_TEST_PORT=3414 npm run test:admin -- --grep 'import CSV.*en light 768' --repeat-each=3` | 3개 통과 |
| `DUO_TEST_PORT=3415 npm run test:e2e -- --grep 'language menu' --repeat-each=10 --workers=1` | 10개 통과 |
| `npm run build` | 기존 Turbopack CSS 포트 바인딩 EPERM으로 실패 |
| `npm run build -- --webpack` | 컴파일·타입·정적 페이지 생성 통과 |

전체 E2E가 통과했다고 보고하지 않는다. R01의 초과 입력은 기존 E2E가 다루지 않던 경계값이다.
SSR + 독립 Chromium 대조 실험으로 보완했으며 앱에 임시 필드/라우트/테스트 데이터를 추가하지 않았다.
관리자 실행은 기존 connect()가 `duo_test_*` 로컬 DB만 허용하는 격리 경로를 사용했고 종료 후 정리됐다.
검사 범위는 Chromium과 로컬 소스다. 운영 배포나 Safari/Firefox 결과로 확대하지 않는다.

로그: `/tmp/duo-astryx-reaudit-{unit,public,admin,import-repeat,language,build,webpack}.log`.
임시 SSR 마크업: `/tmp/duo-astryx-reaudit-probe.html`.

## 57개 TSX 파일 확인표

아래 표의 “추가 지적 없음”은 이번 Astryx 검사 범위에서의 판정이다.

| 파일 | 위젯/위임 경로 | 판정 |
| --- | --- | --- |
| `src/app/[locale]/[section]/page.tsx` | Link, ArrowLeft | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/[id]/page.tsx` | AppIcon, AppStoreBadge, Banner, EditForm, Card, Link, ReviewForm | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/import/page.tsx` | ImportProgress, Link, ImportForm | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/new/page.tsx` | EditForm | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/apps/page.tsx` | Link, Input, Button, Card, AppIcon, AppStoreBadge, EmptyState | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/collections/page.tsx` | AdminQueryProvider, CollectionDashboard | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/layout.tsx` | AdminNavigation, Button, Banner | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/page.tsx` | Card, Link | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/reviews/[id]/page.tsx` | Link, Card, Collapsible, OperationForm, Select, TextArea, Checkbox | R01 길이 계약 |
| `src/app/[locale]/admin/(protected)/reviews/page.tsx` | ReviewList | 추가 지적 없음 |
| `src/app/[locale]/admin/(protected)/submissions/page.tsx` | ReviewList | 추가 지적 없음 |
| `src/app/[locale]/admin/layout.tsx` | re-export / 의미 구조 / 자체 콘텐츠 | 추가 지적 없음 |
| `src/app/[locale]/admin/login/page.tsx` | Card, Banner, LoginForm | 추가 지적 없음 |
| `src/app/[locale]/apps/[slug]/page.tsx` | Link, ArrowLeft, FixtureNotice, AppIcon, StatusBadge, AppStoreBadge, Card, HistoryList | 추가 지적 없음 |
| `src/app/[locale]/error.tsx` | Button | 추가 지적 없음 |
| `src/app/[locale]/layout.tsx` | NextIntlClientProvider, Providers, Header, Link | 추가 지적 없음 |
| `src/app/[locale]/loading.tsx` | Skeleton | 추가 지적 없음 |
| `src/app/[locale]/not-found.tsx` | ButtonLink | 추가 지적 없음 |
| `src/app/[locale]/page.tsx` | ButtonLink, Link, ArrowRight, DevicePreview, Globe2, FixtureNotice, DirectoryOverview, DirectoryControls, Fragment, AppCard, Card, EmptyState, SearchX | 추가 지적 없음 |
| `src/app/[locale]/submit/page.tsx` | Link, SubmissionForm | 추가 지적 없음 |
| `src/app/[locale]/updates/page.tsx` | HistoryList, Card, EmptyState, RoutePagination | 추가 지적 없음 |
| `src/app/api/og/[locale]/route.tsx` | re-export / 의미 구조 / 자체 콘텐츠 | 추가 지적 없음 |
| `src/components/admin/edit-form.tsx` | Input, Card, Select, TextArea, Button, DateInput, Checkbox, Banner | R01 길이 계약 |
| `src/components/admin/import-form.tsx` | ImportProgress, Select, TextArea, FileInput, Banner, Button, ProgressBar, Link, Card | R01 길이 계약 |
| `src/components/admin/login-form.tsx` | Input, Banner, Button | 추가 지적 없음 |
| `src/components/admin/navigation.tsx` | TopNav, TopNavItem | 추가 지적 없음 |
| `src/components/admin/query-provider.tsx` | QueryClientProvider | 추가 지적 없음 |
| `src/components/app-icon.tsx` | Image, Icon | 추가 지적 없음 |
| `src/components/app-store-badge.tsx` | Link, Image | 추가 지적 없음 |
| `src/components/brand-mark.tsx` | Image | 추가 지적 없음 |
| `src/components/device-preview.tsx` | Image, DeviceScene, Button, RotateCcw | 추가 지적 없음 |
| `src/components/device-scene.tsx` | DeviceScreenMaterial, RoundedBox, CameraLens, Panel, Environment, Lightformer, RenderBoundary, Canvas, Suspense, StudioEnvironment, Model | 추가 지적 없음 |
| `src/components/device-screen-material.tsx` | re-export / 의미 구조 / 자체 콘텐츠 | 추가 지적 없음 |
| `src/components/directory/app-card.tsx` | ClickableCard, AppIcon, ArrowUpRight, StatusBadge, AppStoreBadge | 추가 지적 없음 |
| `src/components/directory/controls.tsx` | SideNavItem, Select, Input, Search, Button, SlidersHorizontal, Dialog, DialogHeader, X, Link, Pagination | 추가 지적 없음 |
| `src/components/directory/history-list.tsx` | Card, Link | 추가 지적 없음 |
| `src/components/directory/stats.tsx` | SupportDistribution, Icon | 추가 지적 없음 |
| `src/components/directory/support-distribution-chart.tsx` | BarChart, XAxis, YAxis, Bar, Rectangle, Tooltip, Card | 추가 지적 없음 |
| `src/components/directory/support-distribution.tsx` | DistributionChart | 추가 지적 없음 |
| `src/components/fixture-notice.tsx` | Banner, FlaskConical | 추가 지적 없음 |
| `src/components/header.tsx` | Link, SiteNavigation | 추가 지적 없음 |
| `src/components/operations/collection-dashboard.tsx` | Banner, Link, Button, Card, Collapsible, OperationForm, Select, Input, Checkbox, EmptyState | 추가 지적 없음 |
| `src/components/operations/operation-form.tsx` | Banner, Button | 추가 지적 없음 |
| `src/components/operations/review-list.tsx` | TopNavItem, ClickableCard, EmptyState, RoutePagination | 추가 지적 없음 |
| `src/components/operations/submission-form.tsx` | Banner, Select, Input, TextArea, Button | R01 길이 계약 |
| `src/components/preferences.tsx` | DropdownMenu, Globe2, DropdownMenuRadioGroup, DropdownMenuRadioItem, Switch | A08 반복 10회 통과, 원인 미확정 |
| `src/components/providers.tsx` | InternationalizationProvider, Theme, LinkProvider, ThemeProvider, AstryxProvider | 추가 지적 없음 |
| `src/components/site-navigation.tsx` | Link, BrandMark, TopNav, TopNavItem, Preferences | 추가 지적 없음 |
| `src/components/status-badge.tsx` | Badge, Icon | 추가 지적 없음 |
| `src/components/ui/badge.tsx` | re-export / 의미 구조 / 자체 콘텐츠 | 추가 지적 없음 |
| `src/components/ui/button.tsx` | AstryxButton | 추가 지적 없음 |
| `src/components/ui/form-controls.tsx` | Selector, AstryxTextArea, CheckboxInput | R01 길이 계약 |
| `src/components/ui/input.tsx` | TextInput | 추가 지적 없음 |
| `src/components/ui/link.tsx` | AstryxLink | 추가 지적 없음 |
| `src/components/ui/route-pagination.tsx` | Pagination | 추가 지적 없음 |
| `src/components/ui/skeleton.tsx` | re-export / 의미 구조 / 자체 콘텐츠 | 추가 지적 없음 |
| `src/components/ui/surfaces.tsx` | re-export / 의미 구조 / 자체 콘텐츠 | 추가 지적 없음 |
