# Feature Specification: 004 초기 데이터 가져오기

**Feature Branch**: main (existing local checkout)
**Created**: 2026-10-29
**Status**: Complete — local implementation and verification; hosted launch checks remain in 006
**Input**: 002·003·004를 연속으로 진행하여 가져오기→검토·공개→검색·상세 흐름을 완성한다.

## User Scenarios & Testing

### User Story 1 - 스토어 URL로 앱을 가져온다 (Priority: P1)
관리자는 한국 앱스토어 URL 목록을 넣어 기본 정보를 초안으로 등록한다.
**Why this priority**: 수작업 입력을 줄이고 판정 이전의 자료를 축적한다.
**Independent Test**: 실제 응답 약 10개와 실패 응답으로 필드·지역·중복·오류를 확인한다.
**Acceptance Scenarios**:
1. **Given** 유효한 한국 앱스토어 URL, **When** 가져오기, **Then** 이름·개발사·버전 등 제공되는 정보만 초안에 저장한다.
2. **Given** 한국 스토어에서 찾을 수 없는 앱, **When** 가져오기, **Then** 다른 국가로 대체하지 않고 행별 오류를 알린다.

### User Story 2 - CSV와 근거 제안을 검토한다 (Priority: P1)
관리자는 파일의 각 행 결과를 확인하고 정상 행만 초안으로 축적한다.
**Why this priority**: 후보 약 200개를 관리할 수 있는 일괄 입력 흐름을 제공한다.
**Independent Test**: 동일 파일 재실행, 한 파일의 정상·오류 혼합, 따옴표·개행을 포함한 CSV를 처리한다.
**Acceptance Scenarios**:
1. **Given** 같은 앱과 근거가 있는 CSV, **When** 반복 실행, **Then** 앱·근거가 중복 생성되지 않는다.
2. **Given** 지원 상태·근거 제안, **When** 가져오기 성공, **Then** 제안은 비공개이며 관리자의 명시적 검토 전 공개 판정이 바뀌지 않는다.
3. **Given** 이미 공개된 앱, **When** 새 버전 수집, **Then** 공개 지원 판정·근거·검토일을 보존한다.

### User Story 3 - 수집 결과에서 검토와 공개로 이어간다 (Priority: P2)
관리자는 성공·중복·실패·근거 부족 행을 구분하고 앱 편집 화면에서 검토를 이어간다.
**Why this priority**: 가져오기부터 공개까지의 실제 운영 흐름을 완성한다.
**Independent Test**: 가져온 초안 하나를 근거와 함께 검토·공개하고 방문자가 검색·상세로 확인한다.
**Acceptance Scenarios**:
1. **Given** 일부 요청의 timeout 또는 호출 제한, **When** 가져오기 종료, **Then** 성공 결과와 실패 원인이 남고 실패 행을 다시 시도할 수 있다.
2. **Given** 공식 지원 근거가 없음, **When** 검토 전 결과 표시, **Then** 지원 여부·기능·검토 날짜를 만들어 넣지 않는다.

### Edge Cases
잘못된 URL·내부 주소·리디렉션, 누락 필드, 빈 KR 응답, 429·timeout·잘못된 JSON,
크기/행 수 초과, BOM·CRLF·인용 개행, 중복 ID·근거, 지원하지 않는 카테고리, 중복 실행.


## Requirements

### Functional Requirements

- **FR-001**: 스토어 URL과 CSV 입력을 지원하고 관리자 권한을 모든 가져오기 요청에서 검사한다.
- **FR-002**: CSV 열은 app_store_url, source_url, proposed_status, evidence_summary, announced_at, support_version을 지원한다.
- **FR-003**: 앱 ID와 KR 지역으로 기본 정보를 가져오며 응답에 없는 값은 누락으로 남긴다. 다른 국가로 조용히 대체하지 않는다.
- **FR-004**: 정상 행·잘못된 입력·중복·조회 실패·근거 누락을 구분하고 앱 편집 링크를 제공한다.
- **FR-005**: 앱과 근거의 반복 등록을 방지한다. 신규 앱은 초안으로 저장하고 공개 판정은 자동 변경하지 않는다.
- **FR-006**: 외부 요청은 정해진 공식 스토어 호스트만 사용하고 입력 URL을 임의로 요청하지 않는다. timeout·호출 간격·제한된 재시도를 적용한다.
- **FR-007**: 수집 성공 시각은 실제 응답 성공 시각이며 사람의 검토 시각을 갱신하지 않는다. 기존 근거와 공개 이력을 보존한다.
- **FR-008**: 제공 아이콘·외부 자산의 조건을 기록한다. 권리 미확인 자산을 임의로 공개하지 않는다.
- **FR-009**: 한국어/영어 오류와 결과 안내, 모바일·키보드·두 테마를 지원한다.
- **FR-010**: 실제 앱 약 10개의 API 검증 결과와 누락 필드를 기록하고 재현 가능한 익명화/비밀 없는 테스트 응답을 유지한다.

### Key Entities

가져오기 실행, 행별 결과, 앱/스토어 정보, 검토 전 근거 제안.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 동일 CSV를 2회 실행한 뒤 앱·근거 중복 증가 0건, 자동 공개 또는 판정 변경 0건.
- **SC-002**: 혼합 결과 파일에서 모든 행의 성공 또는 오류를 식별할 수 있다.
- **SC-003**: 가져오기→관리자 검토·공개→공개 검색·상세 흐름을 양 언어에서 완료한다.
- **SC-004**: 실제 KR 앱 약 10개의 응답 구조·누락값·수집 제한 관찰 결과를 기록한다.

## Assumptions

## Local icon storage amendment — 2026-10-29

The user requests stored image files instead of displaying Apple-hosted artwork URLs. Import and
refresh operations download validated Apple CDN icon bytes into an ignored local storage directory;
PostgreSQL records the immutable content path, hash, format, dimensions, source and collection time.
Rendering reads only stored files and never fetches Apple. Failed refreshes preserve the previous
asset. Draft/archived icons are available only to administrators; anonymous readers can retrieve
icons only for published entries. Source URLs remain provenance, not browser image sources.
Public icons accompany a direct App Store badge. No support decisions or review dates change.
Local disk storage is explicitly disabled on Vercel until a persistent storage backend is configured.
Existing 128 icons are backfilled, and the storage contract keeps persistence separate from collection.

- 제품 기준은 docs/PRD.md. 001 완료 상태와 기존 PostgreSQL 로컬 환경을 사용한다.
- 외부 프로젝트 생성·운영 배포는 하지 않는다. 외부 계정 연결의 실환경 검증은 별도로 명시한다.
- 자동 수집/제보 대기열은 005, 출시 환경과 실제 검토 앱 약 100개 목표 최종 충족은 006까지 이어진다. 이번 범위는 가져오기 도구와 약 10개 실제 응답 검증 및 검토 흐름이다.
- 인증 서비스 미설정 시 권한을 자동 부여하지 않는다. 로컬 검증용 신원은 운영에서 금지하며 실제 로그인 검증과 구별한다.
- 테스트용 가상 자료는 전용 검증 DB에서만 사용하며 실제 앱 근거·검토 날짜를 만들지 않는다.
