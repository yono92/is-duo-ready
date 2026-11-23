# Is Duo Ready?

[![CI](https://github.com/yono92/is-duo-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/yono92/is-duo-ready/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

아이폰 듀오 앱 지원 현황을 공식 출처와 함께 확인하는 오픈소스 디렉터리입니다. 앱을 검색하고 지원 상태, 지원 버전, 근거와 변경 이력을 확인할 수 있습니다.

An open-source directory for iPhone Duo app support, with official sources, support versions, and change history.

[서비스 — 한국어](https://is-duo-ready.vercel.app/ko) · [English](https://is-duo-ready.vercel.app/en) · [기여 안내](CONTRIBUTING.md) · [앱·근거 제보](https://github.com/yono92/is-duo-ready/issues/new?template=app-evidence.yml)

Apple 또는 앱 개발사와 제휴하지 않은 독립 프로젝트입니다. 공식 자료를 바탕으로 정보를 제공하며, 실기기 테스트 결과를 대신하지 않습니다.

## 주요 기능

- 앱 이름·별칭 검색, 카테고리·지원 상태 필터, 정렬과 페이지 탐색
- 공식 지원·지원 예정·근거 미확인·미지원 확인 구분, 출처·지원 버전·공개 변경 이력 확인
- 한국어·영어, 라이트·다크 테마와 시스템 기본값, 모바일·키보드 탐색
- 관리자 앱 편집, App Store URL·CSV 가져오기, 출처 수집과 변경 후보 검토
- 비회원 앱 추가·정보 수정 제보

표시 언어와 스토어 국가는 별개이며 현재 데이터 기준은 **한국 App Store(KR)**입니다. 지원 근거 미확인은 공식 미지원 판정과 다릅니다. 자동 수집은 검토할 후보를 만들며, 수집 성공만으로 지원 상태나 검토일을 바꾸지 않습니다.

## 기술 구성

Next.js App Router · React · strict TypeScript · **Meta Astryx** · Tailwind CSS 4 · PostgreSQL · Supabase Auth/Storage · Vercel

UI는 Apple 참고 시각 디자인과 실제 Astryx 컴포넌트를 사용합니다. 적용 기준은 [DESIGN.md](DESIGN.md), 정확한 의존성 버전은 [package.json](package.json)과 잠금 파일에서 확인할 수 있습니다. npm 패키지 식별자는 `duo-ready`, 공개 저장소와 운영 프로젝트 이름은 `is-duo-ready`입니다.

## 로컬 실행

Node.js **22.x** (`.nvmrc`: 22.14.0)와 npm이 필요합니다. DB·관리자 기능에는 Docker Compose도 필요합니다.

### UI만 확인하기

DB와 외부 계정 없이 가상 앱으로 화면을 확인할 수 있습니다.

```sh
npm ci
DIRECTORY_DATA_SOURCE=fixtures npm run dev -- --hostname 127.0.0.1
```

[한국어](http://127.0.0.1:3000/ko) 또는 [영어](http://127.0.0.1:3000/en)를 엽니다. Fixture는 개발·테스트용이며 Vercel에서는 차단됩니다.

### DB·관리자 기능 사용하기

```sh
npm ci
npm run db:start
npm run db:env       # .env.local이 없는 최초 실행에만 사용
npm run db:migrate
npm run admin:local  # 로컬 관리자 설정이 없는 최초 실행에만 사용
npm run env:check
npm run dev -- --hostname 127.0.0.1
```

새 clone에는 운영 앱 데이터·관리자·아이콘 원본이 포함되지 않습니다. [관리자 로그인](http://127.0.0.1:3000/ko/admin/login) 후 [앱 가져오기](http://127.0.0.1:3000/ko/admin/apps/import)에서 데이터를 등록하세요. 가져온 앱은 비공개 초안이며 검토 후 공개합니다.

- 개발용 이메일은 `admin@duo-ready.local`입니다. 생성된 비밀번호는 Git에서 제외된 `.env.local`의 `LOCAL_ADMIN_PASSWORD`에서 확인합니다.
- 최초 설정 명령은 기존 설정을 덮어쓰지 않습니다. 로컬 인증은 production 또는 Vercel 환경에서 차단됩니다.
- DB 모드는 `DIRECTORY_DATA_SOURCE=postgres`입니다. DB 조회 오류를 fixture로 대체하지 않습니다.
- `npm run db:stop`으로 DB를 중지해도 전용 데이터 볼륨은 보존됩니다.

환경 변수와 운영 환경 분리는 [환경 안내](docs/environments.md)를 참고하세요.

## 검증

기본 검사는 다음과 같습니다. 브라우저 검사를 처음 실행하기 전에 `npx playwright install chromium`으로 Chromium을 설치하세요.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

DB·관리자 변경에는 `npm run test:db`, `npm run test:admin`을, production 경계에는 빌드 후 `npm run test:production`, `npm run test:production:db`를 추가로 실행합니다. DB 검사는 임시 `duo_test_*` DB를 만들고 종료 후 제거합니다.

기본 관리자 E2E와 fixture E2E는 `.next-test`를 공유하므로 순차 실행합니다. 분리 실행이 필요하면 `DUO_TEST_PORT=3354 npm run test:admin`처럼 포트를 지정해 출력 폴더도 분리하세요. 실제 통과·실패와 제약은 [검증 기록](docs/verification.md)에 남깁니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [PRD](docs/PRD.md) · [제품 명세](specs/) | 제품 요구사항, 기능별 설계와 작업 목록 |
| [디자인 가이드](DESIGN.md) · [공통 원칙](docs/engineering-principles.md) | 시각·컴포넌트 기준, 근거·공개·접근성 원칙 |
| [환경 안내](docs/environments.md) · [DB 구조](docs/database-architecture.md) | 로컬·운영 구성, 마이그레이션과 RLS |
| [가져오기 명세](specs/004-app-import/spec.md) · [API 검증](docs/import-validation.md) · [수집 운영](docs/collection-operations.md) | URL·CSV 가져오기, 수집 워커, 검토와 제보 처리 |
| [데이터 품질](docs/data-quality.md) · [인기순 데이터](docs/popular-data.md) | 정합성 검사, 차트 출처와 정렬 기준 |
| [출시 기록](docs/release.md) · [검증 기록](docs/verification.md) | 배포·데이터 갱신 기록, 확인한 범위와 남은 작업 |
| [자산 기록](docs/assets.md) · [SEO 관리](docs/seo.md) | 이미지 권리·출처, 공유 카드와 색인 설정 |

공개 앱 수와 지원 상태는 데이터 갱신에 따라 달라집니다. 현재 목록은 서비스에서, 날짜별 반영 내역은 출시 기록에서 확인하세요. 로컬 수집 워커는 [운영 안내](docs/collection-operations.md)에 따라 직접 실행하며 상시 수집 스케줄러와는 별개입니다.

## 기여와 라이선스

코드·번역·접근성 개선과 앱·공식 근거 제보를 환영합니다. [기여 안내](CONTRIBUTING.md), [버그 제보](https://github.com/yono92/is-duo-ready/issues/new?template=bug.yml), [보안 제보](SECURITY.md)를 참고하세요.

직접 작성한 코드는 [MIT](LICENSE)로 공개합니다. 제3자 의존성·App Store 배지·상표·출처 자료에는 각 권리자의 조건이 적용됩니다. [제3자 고지](THIRD_PARTY_NOTICES.md)와 [자산 기록](docs/assets.md)을 확인하세요. 운영 데이터, 비밀 값, 권리 미확인 기기 이미지는 저장소에 포함하지 않습니다.
