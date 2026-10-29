# Feature Specification: 001 디자인 기반·테마·다국어·앱 탐색

**Feature Branch**: local main (feature directory independent of branch)
**Created**: 2026-10-29
**Status**: T001–T038 locally verified, including the user-approved Astryx UI migration; current local runtime is standalone PostgreSQL. Later application DB features are tracked in 002–006; external setup and public-use asset rights remain separate release prerequisites.
**Input**: docs/PRD.md 001 및 사용자의 로컬 구현 요청

## User Scenarios & Testing

### User Story 1 - 앱을 찾고 탐색 맥락을 공유한다 (Priority: P1)
방문자는 카드형 목록에서 이름·영문명·별칭으로 검색하고 카테고리·상태·정렬·페이지를 조합한다.
**Why this priority**: 디렉터리의 핵심 목적이다.
**Independent Test**: 한글 별칭 검색, 복합 필터, 재접속·뒤로 가기의 결과 일치를 확인한다.
**Acceptance Scenarios**:
1. Given 로컬 가상 앱 목록, When 이름·한글·영문 별칭 검색, Then 동일 앱이 검색된다.
2. Given 두 번째 페이지, When 검색·필터·정렬 변경, Then 첫 페이지로 이동한다.
3. Given 필터 URL, When 새로고침·공유·뒤로 가기, Then 제어값과 결과가 일치한다.
4. Given 결과 없음, When 초기화, Then 전체 목록을 보며 앱 추가 안내에도 접근할 수 있다.
5. Given 가상 카드, When 카드 선택, Then 해당 앱의 개발용 상세 안내를 본다.
6. Given 분류 필터, When ko/en 전환, Then 같은 내부 분류를 Apple 공식 한국어·영어 명칭으로 표시하고 데이터 지역 KR을 유지한다.
7. Given `category=creativity`인 이전 공유 URL, When 열기, Then `graphics-design`으로 해석하며 새 URL은 정규 slug를 사용한다.

### User Story 2 - 언어를 바꾸며 같은 정보를 본다 (Priority: P1)
**Why this priority**: 한국어·영어는 첫 버전 필수이며 데이터 지역과 구별되어야 한다.
**Independent Test**: 언어 전환 후 경로·쿼리·스토어 국가·문서 언어를 확인한다.
**Acceptance Scenarios**:
1. Given 루트 방문, When 저장된 선택이 있음, Then 그 언어로 이동한다. 없으면 브라우저 언어, 미지원이면 영어다.
2. Given 명시된 언어 URL, When 다른 언어 쿠키가 있음, Then URL을 우선한다.
3. Given 검색/상세 페이지, When 언어 전환, Then 현재 상세/쿼리를 유지하고 KR 표시를 유지한다.
4. Given 번역 누락 또는 원문 갱신, When 앱 요약 표시, Then 원문과 원문 표시 안내를 보인다.
5. Given 닫힌 헤더, When Globe 아이콘 언어 메뉴를 열기, Then 한국어·English와 현재 선택을 확인하고 키보드로 전환할 수 있다. 닫힌 상태에는 언어명 문구를 표시하지 않는다.

### User Story 3 - 테마와 모바일에서 편하게 탐색한다 (Priority: P1)
**Why this priority**: 접근성과 PRD의 동등한 완료 기준이다.
**Independent Test**: 첫 방문 OS 연동, 단일 switch의 키보드 조작·수동 선택 저장·OS 미추종, 모바일 Sheet 키보드 초점·닫기를 확인한다.
**Acceptance Scenarios**:
1. Given 수동 선택 없는 첫 방문, When OS 테마 변경, Then 화면과 switch 상태가 OS 설정을 따른다.
2. Given 수동 선택한 라이트/다크 테마, When 새로고침하거나 OS 설정 변경, Then 수동 선택을 유지하고 hydration 오류가 없다.
3. Given 모바일 화면, When 필터 열기, Then 카테고리·상태·활성 개수·초기화를 제공한다.
4. Given 데스크톱, When 홈 열기, Then 공통 최대 폭 1120px 안에서 좌측 168px 분류·상태 사이드바와 오른쪽 검색·정렬·카드 열이 정렬되고 첫 화면의 검색·일부 목록이 보인다.
5. Given 헤더의 단일 `role="switch"` 제어, When 포인터 또는 키보드로 전환, Then 라이트·다크가 전환·저장되고 접근 가능한 이름과 `aria-checked`가 현재 다크 상태를 전달한다. 별도 시스템 선택 UI는 없다.

### User Story 4 - 예시와 실제 근거를 구별한다 (Priority: P1)
**Why this priority**: 서비스의 신뢰가 달려 있다.
**Independent Test**: 외부 계정 없이 실행, 배포 환경에서 fixture 차단, 자산 기록 확인.
**Acceptance Scenarios**:
1. Given 외부 설정 없음, When 로컬 실행, Then 가상 앱과 개발용 경고가 보인다.
2. Given 배포 환경, When fixture 요청, Then 샘플 목록이 공개되지 않는다.
3. Given 기기 비주얼, When 표시, Then 화면 예시 안내와 교체 가능한 자산 기록이 있다.

### User Story 5 - 로컬 개발 환경을 재현하고 운영 연결을 준비한다 (Priority: P1)
**Why this priority**: 제품 개발을 로컬에서 계속하면서 이후 Supabase 데이터 설계와 Vercel 운영 설정을 준비한다.
**Independent Test**: 외부 계정 없이 기존 화면과 로컬 데이터 서비스를 실행하고, 환경 파일 생성·설정 검사·연결 확인·잘못된 운영 설정 차단을 재현한다.
**Acceptance Scenarios**:
1. Given 새 로컬 체크아웃과 지원되는 실행 환경, When 문서 순서대로 준비, Then 고정된 도구 버전으로 로컬 서비스를 시작·확인·중지할 수 있다. 외부 프로젝트는 생성하지 않는다.
2. Given 실행 중인 로컬 PostgreSQL, When 환경 설정 생성, Then 필요한 서버 전용 연결 정보를 로컬 파일에 안전하게 저장하고 기존 사용자 설정과 비밀 값을 노출하지 않는다.
3. Given 유효하거나 잘못된 설정, When 검사와 연결 확인 실행, Then 구성 오류와 연결 실패를 구별하며 실제 결과만 보고한다.
4. Given 운영 또는 Preview 빌드 설정, When 로컬 주소·fixture 허용·부적절한 키 등 잘못된 설정이 들어감, Then 빌드를 실패시키고 수정할 설정의 이름을 안내한다.
5. Given 새 연결 설정 완료, When 앱 목록 열기, Then 기존 fixture 경계를 유지한다. 연결 확인만으로 실제 데이터·앱 테이블·관리자 기능이 구현됐다고 표시하지 않는다.
6. Given 로컬 개발, When DB 시작·확인·중지, Then PostgreSQL 하나만 사용하고 중지 후 전용 볼륨 데이터를 보존한다. 로컬 Auth·PostgREST·Studio는 필요하지 않다.

### Edge Cases
- 잘못된 상태·분류·정렬은 기본값, 음수·소수·과대한 페이지는 안전한 범위로 보정한다.
- 검색어는 공백 제거 및 최대 100자, 중복 파라미터는 첫 값, 미지정 키는 탐색에 영향 없음.
- 알려지지 않은 언어/앱은 404. 빈 목록과 데이터 사용 불가 상태는 구별한다.
- 긴 영문 문구, 360px 화면, 번역 누락/검토 필요, 저장소 접근 불가도 처리한다.
- 로컬 서비스 미실행·포트 충돌·연결값 누락·기존 환경 파일이 있는 경우 원인을 알려주며 비밀 값을 출력하지 않는다.

## Requirements

### Functional Requirements
- **FR-001**: Notion Connections의 카드형 탐색 구조와 교체 가능한 기기 자산을 제공한다. 시각 표현은 사용자 지정 Apple 디자인 분석을 프로젝트에 적용한 DESIGN.md를 따른다. 검색·필터·다국어·테마의 동작 요구사항은 유지한다.
- **FR-002**: 검색·카테고리·지원 상태·정렬·페이지를 URL에 보존한다. 페이지 크기는 24다.
- **FR-003**: 기본 공식 지원 우선/검토일 내림차순, 최근 지원 변경, 이름순 정렬을 제공한다.
- **FR-004**: 카드에는 가로로 배치한 아이콘·이름, 개발사, 최대 두 줄 요약, 지원 배지·카테고리 행, 검토일 footer를 표시하되 없는 정보는 만들지 않는다.
- **FR-005**: 한국어·영어 URL 및 메시지 사전, 날짜·복수형, 원문 fallback을 지원한다.
- **FR-006**: Globe 아이콘 메뉴로 언어를 선택하며 닫힌 헤더에는 언어명 문구를 표시하지 않는다. 선택 유지·직접 URL 우선·전환 맥락 보존, KR 고정 지역 표기를 보장한다.
- **FR-007**: 단일 `role="switch"`로 라이트·다크를 전환하고 저장하며 첫 로딩 깜빡임을 방지한다. 첫 방문에는 시스템과 OS 변경을 자동으로 따르되 수동 선택 이후에는 OS 변경을 따르지 않는다. 명시적인 시스템 선택 UI는 제공하지 않는다.
- **FR-008**: 모바일 필터 Sheet, 활성 개수, 초기화와 키보드 접근을 제공한다.
- **FR-009**: 가상 앱·개발용 상태 표시를 제공하고 fixture의 배포 노출을 차단한다.
- **FR-010**: 헤더와 빈 상태의 탐색 목적지는 동작하며 후속 기능은 준비 중임을 명시한다.
- **FR-011**: 언어별 메타데이터·canonical·hreflang·사이트맵 구조를 제공하되 fixture는 색인하지 않는다.
- **FR-012**: 실근거·앱스토어 링크·지원 확인일을 가상 생성하지 않으며 조회 오류를 빈 결과와 구분한다.
- **FR-013**: Apple 공식 카테고리 명칭 중 현재 fixture에 필요한 9개를 사용한다. 내부 slug는 `productivity`, `graphics-design`, `music`, `books`, `travel`, `navigation`, `photo-video`, `entertainment`, `lifestyle`이며 전체 분류나 Apple API 식별자가 아니다. 기존 `creativity` URL은 `graphics-design`으로 정규화한다. 출처와 실데이터 매핑 원칙은 `docs/references/app-store-categories.md`를 따른다.

- **FR-014**: 로컬 데이터 개발은 고정된 PostgreSQL 17 컨테이너와 Docker Compose로 재현하고 외부 계정 없이 실행한다. 전용 저장 공간과 loopback 접속을 사용하며 중지 시 데이터를 보존한다. 운영 대상은 Supabase/Vercel을 유지한다.
- **FR-015**: 로컬 환경 파일은 필요한 연결값만 안전하게 생성하고 저장소에서 제외한다. 기존 파일은 조용히 덮어쓰지 않으며 키와 비밀번호를 로그에 노출하지 않는다.
- **FR-016**: 설정 검사와 연결 smoke 검증은 분리하여 결과를 명시한다. 운영 빌드는 부적절한 환경 설정을 사전에 거부하고 기존 fixture 차단을 유지한다.
- **FR-017**: 요청한 공개 카피 수정은 한국어·영어 메시지 사전에서 관리하며 아직 없는 지원 근거·DB 연동·운영 공개를 암시하지 않는다.
- **FR-018**: 로컬 `DATABASE_URL`은 서버 전용이며 브라우저·로그·저장소에 노출하지 않는다. 연결 검사는 실제 읽기 전용 SQL로 수행하고, 클라우드 설정 검사는 기존 Supabase 공개 변수와 Preview/Production 분리 계약을 유지한다.

### Key Entities
- Directory app: 언어별 이름/설명, 별칭, 분류, 공통 상태, KR, 발행 구분, nullable 검토일, fixture 표식.
- Directory query: 검색, 카테고리, 상태, 정렬, 페이지.
- Asset: 경로, 출처, 사용 조건, 크기, 언어별 대체 텍스트.

## Success Criteria

### Measurable Outcomes
- **SC-001**: 검색·복합 필터·페이지·뒤로 가기·언어 전환 시나리오가 모두 일치한다.
- **SC-002**: 360/768/1440px에서 가로 넘침 없이 1/2/3열을 제공한다.
- **SC-003**: 두 언어와 라이트·다크 화면, 첫 방문 시스템 자동 동작에서 주요 동선에 접근 가능하고 미번역 키가 노출되지 않는다.
- **SC-004**: 가상 근거 URL·가짜 검토일 0건, 배포 환경 fixture 노출 0건이다.
- **SC-005**: 핵심 흐름의 자동 접근성 검사에 serious/critical 위반이 없다.
- **SC-006**: 로컬 준비·설정 검사·연결 확인 순서를 실제로 재현하고 유효하지 않은 운영 설정이 거부됨을 확인한다. 외부 프로젝트 생성·배포와 비밀 값 노출은 0건이다.

## Visual Reference Amendment — 2026-10-29

사용자 지정 https://getdesign.md/apple/design-md 를 시각 참고로 추가했다. 중성 표면, 단일 파란 동작색,
시스템 타이포그래피, pill 검색·버튼과 절제된 카드 표현을 적용한다. 후속 사용자 요청에 따라 헤더는
Globe 언어 메뉴와 단일 라이트/다크 switch로 간결하게 만들고, 자체 제작 로고와 같은 도안의 파비콘을 제공한다.
공통 최대 폭은 1120px이며 hero는 데스크톱 42px 제목과 1.15:0.85 글·기기 배치, 모바일 28~30px 제목과
150px 기기를 중앙에 수직 배치한다. 왼쪽 168px 사이드바에 분류·상태를 모으고 검색·정렬을 오른쪽 카드 열과 정렬한다.
카드는 18px 모서리, 20px 내부 간격·카드 간격, 가로 아이콘·이름, 14px 두 줄 요약, 배지·분류 행, 검토일 footer로 정리한다. 독립 분석을 참고하며 공식 Apple
자산 사용이나 제휴를 암시하지 않는다. 화면 전체 높이 hero는 적용하지 않고 데스크톱 첫 화면의
검색·일부 카드와 1/2/3열 구조를 유지한다. 다크 카드와 지원 상태 의미색은 접근성을 검증해 보완한다.

## Assumptions

- 실제 데이터가 없으므로 실존 앱과 무관한 가상 앱 30개로 페이지 이동까지 확인한다.
- 상태 네 가지는 명시된 UI 예시이며 실제 판정이 아니다. 근거는 빈 배열, 검토일은 null이다.
- 상세·업데이트·제보는 003/005의 실제 기능을 대신하지 않는 로컬 안내 화면이다.
- DB·인증·수집 구현과 최종 기기 자산 확정은 후속 단계다. 외부 프로젝트나 배포를 생성하지 않는다.

- 후속 사용자 요청에 따라 공식 제품 사진의 형태를 참고해 새로 생성한 3D 스타일 AI 렌더(`public/device/iphone-duo-render.png`, 1536×1024 RGBA)를 연결한다. 실제 CAD와의 동일성을 보증하지 않으며 캡션은 “AI 렌더링 · 화면 예시” / “AI render · example screen”으로 표시한다. 출처·생성 기록·대체 텍스트와 두 테마·반응형 검증을 T025에서 완료한다.

## Local tooling amendment — 2026-10-29 (historical Supabase setup)

후속 요청은 카피 수정과 로컬 개발/Vercel·Supabase 운영 기반 준비다. 이는 PRD 002 데이터·관리자
및 006 운영 설정을 위한 로컬 도구 준비이며 새로운 제품 기능이나 새 feature 번호를 만들지 않는다.
기존 001 완료 기록과 탐색 동작을 보존한다. 범위는 고정된 Supabase CLI와 로컬 설정, 로컬 스택,
안전한 환경 파일 생성, 설정 검사·연결 smoke, Vercel 빌드 가드와 운영 인계 문서다.
앱 테이블·마이그레이션·RLS·관리자 인증·실제 목록 DB 어댑터는 002/003에 남긴다.
이번에는 외부 프로젝트 생성·원격 연결 설정·마이그레이션 적용·운영 배포를 수행하지 않는다.
실행 명령과 환경 변수 계약은 `docs/environments.md`, 실제 검증은 `docs/verification.md`에 기록한다.

확정된 상단 카피는 한국어 “iPhone Duo 앱 지원 현황” / “앱별 지원 상태와 근거를 확인하세요.”,
영어 “iPhone Duo app support” / “Check each app’s support status and sources.”다.
Docker 내부 디스크 부족으로 초기 로컬 DB 시작이 실패해 실험적 native stack을 사용한다.
native 시작·데이터 보존 재시작·로컬 Auth/REST 연결 검증을 완료했다. 이 결과는 외부 데이터 연결이나
002/003의 앱 테이블·RLS·관리자·실제 공개 목록 조회가 구현됐다는 의미가 아니다.

## Standalone local PostgreSQL amendment — 2026-10-29

사용자 후속 선택에 따라 현재 로컬 실행 요구사항을 PostgreSQL 단독 개발로 바꾼다. 위 Supabase
실행 성공과 T029–T032는 당시의 검증 이력으로 보존하며 이후 실행 안내는 새 선택을 따른다.
로컬 Supabase CLI·설정·lock·Auth·PostgREST·Studio를 개발 의존성에서 제거하고, PostgreSQL 17
컨테이너 하나와 전용 볼륨을 사용한다. 접속은 `127.0.0.1:55322`, 데이터베이스는 `duo_ready`다.
로컬 전용 계정은 운영에서 사용하지 않으며 서버 전용 `DATABASE_URL`로 전달한다. 이번 작업에서
다운로드한 Supabase Docker 이미지는 사용 여부를 확인하여 요청 범위 안에서 정리하고, 다른
프로젝트 자산·기존 데이터 볼륨은 건드리지 않는다. 정리 여부는 실제 결과로 기록한다.
현재 전환은 PRD 002/006의 준비이며 앱 테이블·RLS·관리자·실제 공개 목록 DB 어댑터를 구현하지
않는다. 외부 Supabase/Vercel 프로젝트 생성·연결·배포도 수행하지 않는다.

## Approved implementation change — 2026-10-29
UI library is Astryx instead of shadcn/ui. Existing user scenarios remain acceptance criteria, including Korean/English, persisted themes, mobile filter focus handling, URL state, form submission and fixture isolation.
