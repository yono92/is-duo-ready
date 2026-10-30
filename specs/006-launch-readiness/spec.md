# Feature Specification: 006 출시 준비와 운영 환경 검증

**Feature Branch**: existing local checkout; feature directory independent of branch
**Created**: 2026-10-29
**Status**: Implementation in progress
**Input**: 사용자 “006 하자 이제”; 최종 사용자 정정: 로컬 개발 + 운영 두 환경만 구성. 기존 Supabase와 Vercel 프로젝트를 is-duo-ready로 변경하고 재사용. 별도 Preview 환경은 만들지 않는다.

## User Scenarios & Testing

### User Story 1 — 환경을 분리하여 배포한다 (Priority: P1)
운영자는 로컬 개발 환경의 변경이 실제 서비스 데이터를 바꾸지 않도록 분리하고, 잘못된 설정을 배포 전에 발견한다.
**Why this priority**: 기존 로컬 구현을 운영으로 옮기기 위한 필수 조건이다.
**Independent Test**: 정상 설정과 잘못된 환경 조합을 검사하고, 시험 환경에서 로그인과 공개/비공개 경계를 확인한다.
**Acceptance Scenarios**:
1. Given 시험/운영 대상, When 설정 검사, Then 서로 다른 저장소와 인증 대상으로 분리하며 누락된 설정은 값 노출 없이 실패한다.
2. Given 운영 배포, When 로컬 로그인·가상 데이터·잘못된 연결 사용, Then 배포를 거부한다.
3. Given 외부 계정 한도 또는 권한 부족, When 생성/연결 실패, Then 정확한 차단 사유를 남기며 배포 성공으로 보고하지 않는다.

### User Story 2 — 저장된 앱 이미지와 콘텐츠를 보존해 이전한다 (Priority: P1)
운영자는 원본 아이콘과 앱 데이터를 다시 수집하지 않고 이전하고, 검토 상태와 출처를 유지한다.
**Why this priority**: 이미지와 데이터가 없는 배포는 실제 서비스를 제공하지 못한다.
**Independent Test**: 동일 파일을 재이전해 중복 없이 해시가 일치하며, 실패한 이전은 기존 파일과 공개 상태를 유지한다.
**Acceptance Scenarios**:
1. Given 저장된 원본 이미지, When 운영 저장소로 이전, Then 파일 내용이 일치하고 외부 원본에 대한 브라우저 의존이 없다.
2. Given 비공개 초안, When 익명 이미지/데이터 요청, Then 내용을 노출하지 않는다.
3. Given 기존 데이터와 실패한 이전, When 재시도, Then 덮어쓰기나 자동 공개 없이 복구할 수 있다.

### User Story 3 — 출시 가능 여부와 복구 절차를 확인한다 (Priority: P1)
운영자는 검증 결과와 미해결 항목을 보고 실제 공개 여부를 판단한다.
**Why this priority**: 구현 완료와 콘텐츠·권한·실환경 출시 완료를 구별해야 한다.
**Independent Test**: 공개 0건·미완료 콘텐츠·미확인 자산이면 미완료를 보고하고, 정상 데이터의 조회와 복구 절차를 확인한다.
**Acceptance Scenarios**:
1. Given 아직 검토하지 않은 128개 초안, When 출시 점검, Then 0개 공개와 남은 근거/분류 검토를 보고하고 검토일을 만들지 않는다.
2. Given 권리 미확인 개발 기기 렌더, When 운영 산출물 생성, Then 해당 파일과 이미지가 배포되지 않는다.
3. Given 시험 배포, When 두 언어·테마·모바일·인증·실패/복구 검사, Then 실제 통과/실패 증거를 기록한다.

### Edge Cases
- 무료 프로젝트 한도, 권한 403, 자격 증명 누락, 장기 작업 타임아웃, 이미지 업로드 일부 실패.
- 시험 환경이 운영 DB를 참조하거나 이미지 저장소가 공개 버킷인 경우.
- 누락/손상 이미지, 로그아웃한 쿠키 재사용, 만료된 인증, 관리자 권한 회수.
- 아직 검토되지 않은 앱을 수량 목표를 맞추려고 자동 공개하는 경우.

## Requirements
### Functional Requirements
- **FR-001**: 기존 로컬 개발 DB를 보존하고 로컬/운영 연결을 분리한다. 운영용 Supabase 프로젝트 하나를 재사용한다. 다른 기존 프로젝트를 변경하지 않는다.
- **FR-002**: 배포 설정은 실제 데이터 모드·인증·서버 전용 DB·영구 이미지 저장소를 요구하고 잘못된 조합을 거부한다.
- **FR-003**: 저장된 이미지 원본을 관리 저장소로 이전하고 크기·해시를 검증한다. 비공개 이미지의 접근 제한을 유지한다.
- **FR-004**: 데이터 이전은 원본과 대상을 명확히 구분하고 기본 점검 모드에서 결과를 예고한다. 초안·출처·시각을 보존하고 자동 공개하지 않는다.
- **FR-005**: 관리자 인증 갱신과 로그아웃·권한 회수를 이미지 경로에도 적용한다.
- **FR-006**: 배포 산출물에 권리 미확인 개발 기기 이미지를 포함하지 않는다. 로컬 개발 화면은 보존한다.
- **FR-007**: 출시 점검은 데이터 수·공개 상태·근거·번역·분류·이미지·자산 조건을 실제 확인하고 완료와 미완료를 분리한다.
- **FR-008**: 한·영, 두 테마, 360/768/1440px, 키보드·접근성, 실패 경계와 production 빌드를 검증한다.
- **FR-009**: 로컬 검증과 운영 연결 점검 후 승인된 운영 배포를 진행하고 실제 URL·대상·검증·복구 방법을 남긴다. 계정 한도/권한/자격증명 미해결은 명시적으로 남긴다.
- **FR-010**: 비밀 값은 저장소·브라우저·일반 로그에 노출하지 않는다. 기존 사용자 환경 파일을 덮어쓰지 않는다.

### Key Entities
- Release target: 시험/운영, 프로젝트 식별자, 연결 상태, 확인 시각, 차단 사유.
- Transfer manifest: 데이터 집계, 원본 파일 해시·크기, 이전 결과. 인증 정보 제외.
- Readiness report: 검사별 결과, 콘텐츠 현황, 미해결 조건과 수행 증거.

## Success Criteria
### Measurable Outcomes
- **SC-001**: 잘못된 환경 조합·가상 데이터·로컬 인증 배포의 회귀 검사가 모두 거부 결과를 낸다.
- **SC-002**: 이전한 모든 이미지의 원본 바이트 일치율 100%, 익명 초안 이미지 노출 0건.
- **SC-003**: 이전 전후 앱 발행 상태·근거·검토 시각 변경 0건, 재실행 중복 0건.
- **SC-004**: 양 언어·테마·뷰포트 핵심 검사 통과, serious/critical 접근성 위반 0건.
- **SC-005**: 실제 배포마다 대상과 URL 및 검증 결과가 기록되고, 외부 미실행을 성공으로 집계하지 않는다.
- **SC-006**: 공개 콘텐츠의 근거 또는 확인 필요 사유 충족률 100%; 약 100개 공개 목표와 현재 실제 수를 구분한다.

## Assumptions
- 006은 출시 코드·운영 환경 연결·배포 준비를 포함한다. 환경은 로컬/운영 두 개이며 프로젝트명은 is-duo-ready다. 별도 Preview 단계는 최종 사용자 요청으로 취소했다.
- 기존 22개 공개 후보에 대한 사람의 내용 검토 승인을 대신하지 않는다. 실제 공개 전 콘텐츠 기준을 충족해야 한다.
- 유료 플랜 변경·기존 프로젝트 중지/삭제·도메인 구매는 별도 사용자 결정이다.
- 첫 배포는 플랫폼 기본 도메인과 비색인 상태를 사용한다. DNS 구매/변경은 필요하지 않다.
- 외부 연결의 필수 자격 증명과 관리자 계정은 해당 환경에서 비공개로 설정해야 한다.

## Final scope correction
사용자는 2026-10-29 별도 Preview DB/배포를 원하지 않는다고 정정했다. 이전 Preview/Production 3단계 계획은 폐기한다. 기존 ref YOUR_PROJECT_REF를 운영으로 재사용하므로 새 DB·유료 플랜은 필요 없다. 실제 앱 Production 배포와 콘텐츠 공개는 정적 준비 페이지 등록 승인과 구별한다.

## 공식 배지 공개 승인 — 2026-10-29 후속 결정

사용자는 App Store의 공식 `Made for iPhone Duo` 배지가 확인된 앱부터 바로 공개하도록 승인했다. 앱별 배지 관측과 KR 배포 확인, 필수 콘텐츠, 출처 충돌 확인을 마치면 추가 공개 승인이나 실기기 평가 없이 기존 공개 흐름으로 처리한다. 근거에는 실제 배지 문구·출처·관측 시각과 이번 사용자 승인 경위를 구분해 남긴다. 기존 22개 릴리스 노트 후보를 배지 확인 대상으로 간주하거나 관측을 사람의 개별 검토로 기록하지 않는다. 배지 확인과 콘텐츠 발행 완료는 실제 앱 배포 완료와 별도로 검증한다. 세부 기준은 docs/PRD.md의 공식 듀오 배지 공개 절을 따른다.

## Initial directory publication — latest owner decision, 2026-10-29

Publish the original 128-app batch: 22 with stored explicit official support wording; 106 as internal `unknown`, displayed as “미지원 · 근거 미확인” / “Unsupported · unverified”. This supersedes the badge-only gate for this batch. Preserve source observations, distinguish update/publication dates from device tests, fill 65 categories from stored Apple primary genre IDs, and record the owner-authorized CLI batch provenance. Use the existing authenticated/RLS publish transaction; no persistent admin account or automatic collector publishing.

## 공유 미리보기·SEO — 2026-10-29
- 한국어·영어의 제목·설명·이미지 문구·검색 소유권 확인 값을 코드 한 파일에서 관리한다. 관리자 설정 UI나 DB 변경은 없다.
- 홈·지원 안내·업데이트·제보·앱 상세 링크는 해당 페이지의 canonical, 언어 대체 URL, OG/Twitter 제목·설명과 1200×630 브랜드 PNG를 제공한다. 앱 설명은 기존 원문 fallback을 사용한다.
- 카카오·Slack·Twitter 등 비-JavaScript 수집기의 최초 HTML head에 메타데이터를 제공한다. 이미지 렌더는 외부 요청·DB 없이 동작한다.
- 검색 색인은 기존 PUBLIC_INDEXING opt-in을 유지한다. 실제 운영 사이트의 소셜 수집은 별도 허용하며 로컬·fixture·Preview는 계속 robots 차단한다. 관리자·API 비공개 경계, 공개 앱 전용 사이트맵, 실제 검토일을 보존한다.
- 양 언어 raw HTML·PNG 치수·메타데이터 fallback·색인 경계와 필수 저장소 검증을 실행하고 실제 배포 여부를 별도로 기록한다.

## CI failure and duration — 2026-10-30

사용자 요청에 따라 GitHub Actions의 반복 실패와 실행 시간을 함께 개선한다. 정적 검사,
공개 브라우저, 격리 DB 관리자 브라우저, 빌드·운영 경계 검사를 독립 실행하며 기존 필수
`verify`는 모든 결과의 성공을 요구한다. 관리자 shard는 서로 다른 runner/임시 DB를 쓰고
내부 DB 변경은 단일 worker로 유지한다. 실패 trace를 보관하고 검사 생략·자동 재시도나
timeout 확대로 실패를 숨기지 않는다. 로컬 검증과 실제 원격 재실행 결과를 구별한다.
