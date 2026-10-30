<!-- Sync impact: scaffold -> 1.0.0; seven product principles added; delivery/governance defined; no deferred placeholders. -->
# Is Duo Ready? Constitution

## Core Principles

### I. 근거 기반 판정
공식 지원·예정·미지원은 공식 출처가 뒷받침해야 한다. 정보 부재는 미지원이 아니다.
확인 필요는 조사 사유와 검토일을 필요로 한다. 미조사 앱은 초안이다.
지원 버전과 현재 버전, 수집 성공 시각과 사람의 검토 시각을 구분한다.

### II. 수집과 승인 분리
자동 수집은 변경 후보만 만든다. 관리자 검토 없이 공개 지원 상태를 변경하지 않는다.
승인은 상태·근거·이력을 하나의 트랜잭션으로 반영한다.

### III. 공개와 비공개 분리
published 데이터만 공개한다. 초안·제보·내부 메모·관리자 정보는 비공개다.
노출 테이블은 RLS를 적용하고 로그인 여부와 관리자 권한을 구분한다.
비밀 키는 서버에만 두며 실제 비밀 값을 저장소에 넣지 않는다.

### IV. 언어·테마·화면 크기 동등성
한국어·영어, 라이트·다크·시스템, 모바일·태블릿·데스크톱을 동일한 완료 기준으로 검증한다.
언어는 URL과 메시지 사전으로 관리한다. 표시 언어와 스토어 국가는 별개이며 초기 국가는 KR이다.
키보드 접근, 명시적 라벨, 보이는 초점, 일반 본문 4.5:1 대비를 유지한다.

### V. 실패와 이력 보존
외부 연동 실패·새 버전·릴리스 노트 누락만으로 기존 지원 상태나 근거를 지우지 않는다.
조회 오류와 실제 빈 결과를 구분한다. 정정은 새 이력으로 남긴다.

### VI. 재현 가능한 변경
PRD → 명세 → 설계 → 작업 목록 → 구현 → 검증 순서를 따른다.
DB 변경은 재현 가능한 마이그레이션으로 관리한다. 의존성은 잠금 파일에 고정한다.
기능 완료 보고는 실행 명령, 실제 검증 결과, 남은 외부 설정을 포함한다.

### VII. Fixture와 자산 정직성
개발 fixture는 가상임을 화면·타입·파일에서 명시하며 운영에서 노출하지 않는다.
실제 앱에 가짜 지원 근거·확인일·스크린샷을 만들지 않는다.
기기 자산에는 출처·권리·대체 텍스트·크기를 기록한다. 권리 미확인 공식 이미지는 사용하지 않는다.

## Product and Technical Boundaries

서비스명은 Is Duo Ready?, 프로젝트 식별자는 duo-ready다. 기준 문서는 docs/PRD.md다.
Next.js App Router, TypeScript, Astryx, Tailwind CSS, Supabase를 사용하며 Vercel을 배포 대상으로 둔다.
001은 로컬 UI와 탐색 기반이다. DB·인증·수집·운영 배포는 후속 명세에서 다룬다.
외부 프로젝트 생성 및 운영 배포는 이번 작업에 포함하지 않는다.

## Development Workflow and Quality Gates

기능별 specs/ 아래에 독립 검증 가능한 사용자 시나리오, 설계, 작업 목록을 작성한다.
필수 게이트는 타입 검사, 린트, URL/검색/fixture 노출 정책 단위 검증, 핵심 브라우저 흐름,
반응형·접근성 확인, production build다. 검증 실패를 숨기거나 통과로 기록하지 않는다.

## Governance

사용자의 명시적 지시와 PRD가 제품 범위를 결정한다. 원칙 변경은 근거와 영향을 기록하고
호환성을 깨면 major, 새 원칙은 minor, 설명 보완은 patch로 버전을 올린다.
모든 기능 설계는 구현 전과 후에 본 원칙의 준수 여부를 기록한다.

**Version**: 1.0.2 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29

Amendment 1.0.1 (2026-10-29): 사용자 승인에 따라 UI 기반을 shadcn/ui에서 Astryx로 교체한다. 제품·접근성·데이터 원칙은 유지한다.

Amendment 1.0.2 (2026-10-29): 사용자 후속 지시에 따라 부분 교체에서 전체 공개·관리자 UI의 Astryx Neutral 및 실제 입력 컴포넌트 적용으로 범위를 명확히 한다. 데이터·접근성 원칙은 유지한다.

## Phase 14: 전체 Astryx 컴포넌트 / Neutral 전환
- [x] T039 실제 TextInput/TextArea/Selector/CheckboxInput/DateInput/FileInput으로 공개·관리자 폼을 교체하고 FormData·필수 검증·초기화 계약을 유지한다.
- [x] T040 탐색·Switch·카드·접기·알림·진행·빈 결과를 Astryx로 교체하고 기존 색상·컨트롤 CSS 강제 오버라이드를 제거한다. DESIGN/PRD/명세를 최신 사용자 지시에 맞춘다.
- [x] T041 실제 옵션 선택·날짜·파일 저장, ko/en·테마·반응형·접근성, lint/typecheck/unit/E2E/build를 검증하고 docs/verification.md에 실제 결과를 기록한다.

## Phase 15: 인터랙티브 기기 콘셉트
- [x] T042 홈 기기 영역에 Three.js/R3F/Drei 기반 두 패널의 3D 회전·접힘, Astryx 제어, ko/en·키보드·터치 지원을 구현하고 자산 및 디자인 기준을 기록한다.
- [x] T043 회전·접힘·초기화와 반응형·접근성을 브라우저에서 검증하고 lint/typecheck/unit/E2E/build 결과를 기록한다.

## Phase 16: 접힘 화면 전환
- [x] T044 접힘 속도에 반응하는 화면 전용 블러와 선명도 복귀를 구현하고 실제 GPU uniform·reduced motion·회전만 조작·필수 검증을 확인한다.

## Phase 17: Apple 디자인 + Meta 컴포넌트 기준 복원
- [x] T045 Apple 참고 시각 토큰, 헤더·hero·앱 카드 위계 및 절제된 모션을 구현하고 DESIGN/AGENTS/PRD의 역할 구분을 바로잡는다.
- [x] T046 ko/en·라이트/다크·반응형·키보드·reduced motion 및 필수 검증을 실행하고 docs/verification.md에 기록한다.

## Phase 18: 공개 문구 정리
- [x] T047 홈·지원 안내·푸터의 ko/en 문구를 간결하게 수정하고 중복 소개·슬로건을 제거한다. 실제 상태명과 정의, 공식 배지 근거, 한국 스토어 기준을 유지한다.
- [x] T048 변경된 탐색 라벨을 기존 E2E에 반영하고 lint/typecheck/unit/E2E/build 및 양 언어 화면 확인 결과를 docs/verification.md에 기록한다.

## Phase 19: 기기 직접 조작
- [x] T049 실제 가장자리 드래그로 접힘/펼침을 변경하고 단독 초기화·수직 회전 방향·키보드·모바일 조작 및 필수 검증을 완료한다.
- [x] T050 가장자리 손잡이 장식을 제거하고 투명 드래그 영역·키보드 초점·기존 조작을 유지하며 검증한다.

## Phase 20: 전 화면 문구 검토
- [x] T051 ko/en 전체 메시지·직접 작성 문구·가상 앱 설명을 검토하고 번역투·추상적 비유·중복 소개·죽은 개발 안내를 정리한다. 실제 상태에 맞는 가져오기·수집·오류 안내와 기존 정책을 보존한다.
- [x] T052 기존 공개·관리자 E2E 기대 문구를 갱신하고 lint/typecheck/unit/공개 E2E/관리자 E2E/build와 화면 검토 결과를 docs/verification.md에 기록한다. 기본 Turbopack 빌드는 환경 포트 오류로 실패했으며 공식 Webpack 빌드로 검증했다.

## Phase 21: 자체 제작 3D 운영 공개 — 2026-10-30
- [x] T053 홈 3D의 로컬 PNG·Vercel 게이트 의존을 제거하고 공개 가능한 자체 SVG fallback과 기존 PNG 차단을 유지한다. PNG 유무와 무관하게 3D E2E를 실행한다.
- [x] T054 lint/typecheck/unit/E2E/build/production 경계 검증 후 기존 Vercel 프로젝트에 반영하고 공개 ko/en·3D 조작·fallback·PNG 404 결과를 기록한다. 로컬 기본 빌드는 기존 EPERM으로 실패, Webpack 및 Vercel 기본 Turbopack 빌드는 통과했다.

## Phase 22: 홈 광고 공간 — 2026-10-30
- [x] T055 7개 이상 목록의 6번째 카드 뒤에 전체 열 광고 공간·ko/en 라벨·테마 대응을 추가한다.
- [x] T056 lint/typecheck/unit/E2E/build 결과와 실제 애드센스 연결 후속 절차를 기록한다.

- [x] T057 사용자 제공 AdSense 인증 메타 태그를 공통 레이아웃에 추가하고 ko/en head 및 필수 검증을 확인한다.

## Phase 23: 공통 푸터 정보 — 2026-10-30

- [x] T058 ko/en 저작권·독립 서비스 안내·지원 안내 및 정보 제보 링크를 공통 푸터에 반영한다.
- [x] T059 필수 검사와 ko/en 푸터 렌더링·탐색을 검증하고 결과를 기록한다.

## Phase 24: AdSense ads.txt — 2026-10-30

- [x] T060 사용자 게시자 ID의 ads.txt를 추가하고 로컬 HTTP 응답·필수 검사 결과 및 운영 반영 절차를 기록한다.

## Phase 25: Astryx 전수검사 — 2026-10-30

- [x] T061 전체 TSX·공통 어댑터·CSS·provider를 설치된 Astryx API와 대조하고 공개/관리자 브라우저 검증을 수행한다. `docs/astryx-audit.md`에 7개 확정 문제, 간헐적 키보드 실패 및 검사 시점/병행 변경 한계를 기록했다.
- [x] T062 A01–A03: 오류 색상 토큰, Button 로딩 API 전달, 관리자 현재 섹션 선택 상태를 수정하고 해당 오류·pending·중첩 경로를 검증한다. 실제 isLoading의 초점 보존·중복 활성화 차단, 360px 메뉴 및 양 테마 오류 색상 검증을 포함한다.
- [x] T063 A04–A07: EmptyState 5개 분기, Banner 알림·로컬 안내, hasMore Pagination, 브랜드·공식 배지·스킵 Link를 실제 Astryx로 교체했다. state/hasNext 계약과 스킵 이후 Tab 순서를 보존하고 해시 탐색만 부드럽게 스크롤한다. 최종 공개 32개·관리자 42개와 lint/typecheck/unit/Webpack build를 확인했다. 기본 Turbopack EPERM은 별도로 기록했다.
- [ ] T064 A08: 언어 메뉴의 빠른 닫기/재열기·Home/Enter 실패를 trace로 분리하고 원인에 맞게 수정한다. 단일 통과로 완료 처리하지 않고 반복 키보드 검증 및 필수 게이트를 기록한다.

T064의 메뉴는 이미 실제 Astryx다. 이번 미적용 교체 후 반복 5회 및 전체 공개 E2E에서는 통과했으나,
이 간헐적 문제의 원인을 특정하는 수정을 하지 않아 별도 원인 추적 항목은 미완료로 보존한다.

## Phase 26: Astryx 교체 후 재전수검사 — 2026-10-30

- [x] T065 TSX 57개·CSS 변수·공통 래퍼·소비 화면을 재검사하고 전체 공개/관리자·언어 반복·실패 반복·브라우저 길이 대조를 실행했다. `docs/astryx-reaudit.md`에 추가 미교체 0종, 새 R01 및 원인 미확정 R02, 실제 실패/통과 결과를 기록했다.
- [ ] T066 R01: 실제 Astryx TextArea를 유지하면서 native maxLength로 보이는 래퍼의 길이 검증·안내를 보완한다. 8개 호출의 grapheme/UTF-16/UTF-8 byte 계약을 서버와 대조하고 ASCII 경계·이모지/결합 문자·초과 제출을 검증한다. 서버 제한을 임의로 완화하지 않는다.
- [ ] T067 R02: 관리자 en/light/768의 입력 방식 → CSV option 클릭 timeout을 trace 및 실사용 브라우저로 분리한다. 앱·라이브러리·테스트/자원 경합 중 원인을 확정하고 필요한 수정과 반복 검증을 기록한다. 3회 재실행 통과만으로 해결 처리하지 않는다.

T064 언어 메뉴는 재검사에서도 반복 10회와 전체 공개 E2E를 통과했다. 원인 수정이 없으므로
미완료 이력을 유지하며, R02와 같은 원인이라고 단정하지 않는다.
