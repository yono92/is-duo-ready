# Is Duo Ready?

[![CI](https://github.com/yono92/is-duo-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/yono92/is-duo-ready/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

아이폰 듀오 앱 지원 정보를 **확인 가능한 근거와 함께** 모으는 오픈소스 디렉터리입니다. 앱 개발자와 사용자들이 듀오 생태계의 정보를 함께 쌓을 수 있도록 코드·번역·앱 제보·출처 검증에 대한 기여를 받습니다.

An open-source, evidence-backed directory for iPhone Duo app compatibility. Help build the ecosystem through code, translations, app suggestions, and verifiable sources.

**개발 중 / Work in progress.** 가져온 앱은 검토 전 초안이며, 수집만으로 지원 판정이나 검토일을 만들지 않습니다. 실제 서비스 공개와 코드 공개는 별개입니다. Apple 또는 앱 개발사와 제휴하지 않은 독립 프로젝트입니다.

- [기여 안내 / Contributing](CONTRIBUTING.md)
- [앱·근거 제보 / Suggest an app](https://github.com/yono92/is-duo-ready/issues/new?template=app-evidence.yml)
- [버그 제보 / Report a bug](https://github.com/yono92/is-duo-ready/issues/new?template=bug.yml)
- [보안 제보 / Security](SECURITY.md)

Next.js App Router · TypeScript · Tailwind · shadcn/ui · PostgreSQL · Supabase. 운영 프로젝트와 공개 저장소 이름은 `is-duo-ready`, 내부 npm 패키지 식별자는 `duo-ready`입니다.

## 로컬 실행

Node.js 22.x (`.nvmrc`: 22.14.0), npm, Docker Compose를 사용합니다.

```sh
npm ci
npm run db:start
npm run db:env       # .env.local이 없는 최초 실행에만 사용
npm run db:migrate
npm run admin:local  # 로컬 관리자 설정이 없는 최초 실행에만 사용
npm run env:check
npm run dev -- --hostname 127.0.0.1
```

새 clone에는 실제 앱 DB·관리자·이미지 원본이 없습니다. 위 명령으로 개발 DB를 준비하고 관리자 화면에서 직접 앱을 가져오세요. 설정 파일이 이미 있으면 최초 설정 명령으로 덮어쓰지 마세요.

- 공개 목록: [한국어](http://127.0.0.1:3000/ko), [영어](http://127.0.0.1:3000/en)
- 관리자: [로그인](http://127.0.0.1:3000/ko/admin/login), [앱 가져오기](http://127.0.0.1:3000/ko/admin/apps/import)
- 개발용 이메일은 `admin@duo-ready.local`입니다. 생성된 비밀번호는 Git에서 제외된 `.env.local`의 `LOCAL_ADMIN_PASSWORD`를 확인하세요. 파일 권한은 `0600`이며 명령 출력에 비밀번호를 남기지 않습니다.
- 로컬 인증은 명시적 개발용입니다. `NODE_ENV=production` 또는 `VERCEL` 환경에서는 차단합니다. 운영 Supabase Auth 검증을 대신하지 않습니다.
- 현재 일반 DB에는 실제 KR 앱 128개를 초안으로 가져왔고, 22개는 직접적인 지원 근거와 한국어·영어 설명을 준비했습니다. 사람의 공개 승인은 아직 하지 않아 공개 목록은 비어 있습니다. [초기 데이터·공개 승인 대상](docs/initial-data.md)을 확인하세요.

UI 시안만 볼 때는 `DIRECTORY_DATA_SOURCE=fixtures npm run dev`로 시작합니다.
DB 모드는 `DIRECTORY_DATA_SOURCE=postgres`이며 조회 오류를 fixture로 대체하지 않습니다.
작업 후 `npm run db:stop`으로 DB를 중지하면 전용 데이터 볼륨은 보존됩니다.

## 구현된 흐름

1. 한국 App Store URL 또는 UTF-8 CSV를 가져옵니다. 최대 512 KiB·200행, 행별 오류·중복·재시도와 중단 후 이어서 처리를 지원합니다.
2. 성공한 앱은 비공개 초안입니다. 지원 상태·근거 제안은 자동 승인되지 않습니다. 기존 공개 판정·근거·검토일·이력을 그대로 보존합니다.
3. 관리자가 두 언어의 설명, 원문 언어, 공식 출처·발췌·지원 버전·기능을 검토합니다. 원문 수정은 번역을 검토 필요로 표시하고 동시 수정 충돌을 감지합니다.
4. 명시적 공개는 판정·공개 스냅샷·변경 이력·감사 기록을 하나의 트랜잭션으로 저장합니다. 공식 지원·예정·미지원에는 공식 근거, 확인 필요에는 조사 사유가 필요합니다.
5. 방문자는 검색·복합 필터·정렬·24개 페이지, 근거·현재/지원 버전·검토일·공개 이력을 확인합니다. 과거 주소는 현재 공개 주소로 연결하고 보관 앱은 숨깁니다.

언어별 URL, 검색 맥락, KR 스토어 기준, 원문 fallback, 라이트/다크/시스템 테마,
모바일 필터와 키보드 접근을 유지합니다. 데이터와 UI의 기준은 [PRD](docs/PRD.md),
[DESIGN.md](DESIGN.md), [공통 원칙](.specify/memory/constitution.md)입니다.

## 변경 수집과 제보

- [출처 수집](http://127.0.0.1:3000/ko/admin/collections): 공식 출처·이용 조건 확인 후 감시 대상을 등록하고 수동 확인·일시 중지·재시도합니다.
- [검토 대기함](http://127.0.0.1:3000/ko/admin/reviews): 공개 정보·새 후보·저장된 수정안을 비교하여 승인·보류·기각합니다. 승인만 공개 정보에 반영됩니다.
- [제보](http://127.0.0.1:3000/ko/submit)와 [제보 관리](http://127.0.0.1:3000/ko/admin/submissions): 연락처 없이 비공개 접수하며, 검증·속도 제한·중복 방지를 적용합니다.

```sh
npm run collect              # 확인 시각이 된 출처 최대 5개
npm run collect -- --watch    # 로컬 반복 실행; Ctrl-C로 종료
```

기본 확인 주기는 하루입니다. 반복 실행은 워커를 직접 실행해야 하며 현재 켜 놓은 정기 워커나 운영 Cron은 없습니다.
수집은 새 버전·릴리스 노트를 후보로 보존하고 초안·공개 상태·검토일을 자동 변경하지 않습니다.
일반 웹 출처는 공식 호스트 확인·공인 IP 연결 고정·robots 정책·시간/크기 제한을 적용합니다.
[운영 안내](docs/collection-operations.md)에 재시도·중단 복구·검토·제보 제한과 006 스케줄러 연결 경계를 정리했습니다.

## CSV 형식과 실제 API 검증

필수 열: `app_store_url`. 선택 열: `source_url`, `proposed_status`, `evidence_summary`,
`announced_at` (`YYYY-MM-DD`), `support_version`. 상태 값은 `supported`, `planned`,
`unknown`, `unsupported` 중 하나이며 입력된 값은 검토 제안일 뿐입니다.

```csv
app_store_url,source_url,proposed_status,evidence_summary,announced_at,support_version
https://apps.apple.com/kr/app/id361309726,,,,,
```

입력 URL은 앱 ID 추출에만 사용하고, 실제 요청은 Apple Lookup의 KR 고정 주소로만 보냅니다.
3초 이상 간격, 요청별 8초 제한, 최대 2회 재시도, 응답 크기 제한을 적용합니다.
아이콘 원본 파일을 Apple 이미지 서버에서 수집하여 로컬에 저장합니다. 화면은 우리 이미지 API를
사용하고 원본 URL은 출처·갱신용으로만 보관합니다. 파일이 없거나 읽기에 실패하면 일반 아이콘을 표시합니다.

### 로컬 앱 아이콘

- 파일: `.data/app-icons/` (또는 `APP_ICON_STORAGE_DIR`). Git에서 제외하며 DB와 함께 백업합니다.
- PostgreSQL: `005_app_icon_assets.sql`에 경로·해시·형식·크기·출처·수집 시각을 저장합니다. 이미지 바이너리는 파일에 저장합니다.
- 신규 가져오기는 아이콘도 수집합니다. 기존 데이터/실패 건은 `npm run icons:sync`, 같은 URL도 다시 받으려면 `npm run icons:sync -- --refresh`를 실행합니다. 개발 관리자 설정이 필요합니다.
- 검증과 파일 저장에 성공한 뒤 DB 포인터를 바꿉니다. 수집 실패 시 이전 파일을 유지합니다. 이전 파일의 자동 삭제는 하지 않습니다.
- 초안 이미지는 관리자만, 공개 항목 이미지는 누구나 조회할 수 있습니다. 보관·로그아웃을 즉시 반영하도록 응답은 `private, no-store`입니다.
- HTTPS Apple 이미지 호스트만 허용하며 리다이렉트·2 MiB 초과·잘못된 이미지·2048px 초과를 거부합니다.
- 향후 Supabase Storage 어댑터 연결은 별도 작업입니다. 현재 로컬 파일 어댑터는 Vercel에서 차단됩니다.
- 아이콘 옆에 해당 앱으로 연결되는 공식 App Store 배지를 표시합니다. [사용 조건과 출처](docs/assets.md)를 기록했습니다.

`npm run test:apple`은 실제 앱 10개의 메타데이터를 읽기 전용으로 재검증하고 기록을 갱신합니다.
이번 조회는 10/10개 성공했으며 [실조회 기록](docs/import-validation.md)에 이름·버전·누락 필드·정확한 시각이 있습니다.
이 결과는 듀오 지원 근거나 사람의 검토 결과가 아닙니다.

## 검증

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npx playwright install chromium
npm run test:admin
npm run test:e2e
npm run build
npm run test:production
npm run test:production:db
npm run format:check
```

`test:db`와 `test:admin`은 임시 `duo_test_*` DB를 만들고 종료 후 제거합니다. 앱 DB를 초기화하지 않습니다.
기본 관리자 E2E는 3350, fixture E2E는 3351 포트에서 `.next-test`를 사용하므로 **기본 명령은 순차 실행**합니다.
다른 작업과 검증을 분리할 때는 `DUO_TEST_PORT=3354 npm run test:admin`,
`DUO_TEST_PORT=3355 npm run test:e2e`처럼 서로 다른 포트를 지정하면 생성 폴더도 `.next-test-<port>`로 분리됩니다.
production 검증은 `.next` 빌드와 3311~3313 임시 포트를 사용합니다. 결과 화면/실패 trace는 `test-results/`에 저장합니다.
가상 지원 근거는 격리 테스트 DB에만 생성합니다. 실제 앱에 가짜 근거나 검토일을 넣지 않습니다.

## 환경과 후속 범위

DB는 PostgreSQL 17.11, 로컬 주소는 `127.0.0.1:55322`, DB명은 `duo_ready`입니다.
Supabase Auth의 검증된 사용자와 DB 관리자 허용 목록을 별도로 확인하며, 실제 쿼리는 서버의
PostgreSQL 트랜잭션에서 `anon`/`authenticated` 역할과 RLS를 적용합니다. 자격 증명은 공개 변수에 넣지 않습니다.
[환경 안내](docs/environments.md)에 hosted 설정 계약과 검증되지 않은 외부 항목을 구분했습니다.

- **006**: 실제 Supabase Auth·권한·세션·TLS 연결 검증, 로컬 개발/운영 분리·Vercel 운영 연결·출시 검증.
- **콘텐츠**: 후보 약 200개와 실제 앱 약 100개의 근거 조사·검토. 가져오기 도구 완성과 별도입니다.
- **자산**: 기기 렌더의 공개 사용 권리는 미해결입니다. 앱 아이콘의 판촉 표시 조건과 출처는 [자산 기록](docs/assets.md)에 정리했습니다.

006에서 기존 Supabase와 Vercel 프로젝트를 `is-duo-ready` 운영용으로 정리했습니다. 별도 Preview 환경은 사용하지 않습니다. 실제 배포·검증 상태는 [출시 기록](docs/release.md)을 확인하세요. 공개 색인은 `PUBLIC_INDEXING=true`,
`NODE_ENV=production`, `VERCEL_ENV=production`, `DIRECTORY_DATA_SOURCE=postgres`, 공개 HTTPS origin이 모두 필요합니다.
개발·Preview에서는 noindex이고 fixture 앱은 사이트맵에서 제외합니다.

[001 명세](specs/001-design-app-directory/spec.md) · [002 명세](specs/002-admin-evidence/spec.md) ·
[003 명세](specs/003-public-directory/spec.md) · [004 명세](specs/004-app-import/spec.md) ·
[005 명세](specs/005-collection-review/spec.md) · [006 명세](specs/006-launch-readiness/spec.md).
Spec Kit 1.0.13은 `.agents/skills/speckit-*/SKILL.md`를 사용합니다. 명세→설계→작업→구현→검증 순서를 따릅니다.
기술과 정확한 의존성 버전은 `package.json`과 `package-lock.json`에 고정했습니다.

## UI foundation: Astryx

The user-approved UI migration replaces shadcn/ui and Radix with pinned Astryx 0.7.4. Buttons, badges, skeletons, the language menu and mobile filter dialog use Astryx. Native inputs inside Astryx Field preserve file/date/URL controls, FormData, browser validation and reset semantics.

- `src/app/layers.css` declares reset/theme/base/Astryx/components/utilities order.
- `src/app/globals.css` imports the built Neutral theme and maps project colors and system typography. No remote fonts or StyleX compiler are required.
- `src/components/providers.tsx` preserves next-themes storage and OS behavior, then synchronizes Astryx after hydration.
- `src/components/ui/` contains project adapters. The shadcn generator config and Radix dependency are removed.

References: [styling](https://astryx.atmeta.com/docs/styling-overview), [themes](https://astryx.atmeta.com/docs/theme), [migration](https://astryx.atmeta.com/docs/migration).

## 라이선스와 자산

직접 작성한 코드는 [MIT](LICENSE)로 공개합니다. 제3자 의존성·App Store 배지·상표·출처 자료는 각 원저작자의 조건을 따르며 MIT 재허가 대상이 아닙니다. [제3자 고지](THIRD_PARTY_NOTICES.md)와 [자산 기록](docs/assets.md)을 확인하세요. 운영 데이터, 환경 비밀 값, 가져오기 원본, 공개 사용 권리가 정리되지 않은 기기 렌더는 Git에 포함하지 않습니다. 기기 렌더 없이도 새 clone을 실행할 수 있습니다.
