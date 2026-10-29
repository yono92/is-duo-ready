# 로컬 개발과 운영 환경

환경은 두 개입니다. 로컬에서는 PostgreSQL과 로컬 이미지 파일을 사용하고, 운영에서는 하나의 Supabase DB/Auth/Storage와 Vercel을 사용합니다. 운영 프로젝트 이름은 모두 `is-duo-ready`입니다. 별도 Preview DB는 만들지 않고 Preview에 운영 자격 증명을 제공하지 않습니다.

## 로컬 시작

```sh
npm run db:start
npm run db:env
npm run db:migrate
npm run admin:local
npm run env:check
npm run dev -- --hostname 127.0.0.1
```

`db:env`와 `admin:local`은 최초 설정용이며 기존 설정을 덮어쓰지 않습니다. Node22와 `compose.yaml`의 고정 PostgreSQL17 이미지/digest를 사용합니다. DB는 loopback55322에만 연결하며 운영 비밀번호를 사용하지 않습니다. 새 clone은 운영 데이터와 기기 렌더를 포함하지 않습니다.

`.env.local`은 로컬 개발 전용입니다. UI만 확인하려면 `DIRECTORY_DATA_SOURCE=fixtures`를 명시합니다. 실제 DB 조회는 `postgres`이며 오류를 fixture로 바꾸지 않습니다. 로컬 로그인은 opt-in이고 `NODE_ENV=production` 또는 `VERCEL`이면 차단합니다. 설정을 바꾸면 개발 서버를 재시작하세요. `db:stop`은 볼륨을 삭제하지 않습니다.

## 운영 설정

운영 연결값은 `.env.hosted.production.local`(0600)에 분리합니다. **`.env.production.local`에는 넣지 마세요.** Next가 로컬 production 빌드에서 자동으로 읽을 수 있기 때문입니다. Vercel에는 Production 범위로만 설정합니다.

| 변수 | 운영 값/조건 |
| --- | --- |
| `DATABASE_URL` | 프로젝트가 일치하는 SQL 연결, `sslmode=verify-full` |
| `NEXT_PUBLIC_SUPABASE_URL` | 해당 프로젝트 HTTPS origin |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 해당 프로젝트 공개 키 |
| `SUPABASE_PRODUCTION_PROJECT_REF` | 해당 프로젝트 ref |
| `DIRECTORY_DATA_SOURCE` | `postgres` |
| `ICON_STORAGE_PROVIDER` | `supabase` |
| `SUPABASE_STORAGE_BUCKET` | 비공개 `app-icons`, 최대2MiB |
| `SUPABASE_SECRET_KEY` | 서버 전용 Storage 키 |
| `NEXT_PUBLIC_SITE_URL` | 실제 검증된 서비스 HTTPS origin |
| `LOCAL_ADMIN_AUTH`, `LOCAL_FIXTURES` | `false` |
| `PUBLIC_INDEXING` | 출시 검토 전 `false` |

DB URL과 Secret key는 절대로 `NEXT_PUBLIC_`에 넣지 않습니다. 호스트 override를 막기 위해 연결 query는 검증한 `sslmode`만 허용합니다. Supabase 공식 CA를 드라이버에 명시하며 인증서/호스트 검증을 끄지 않습니다. 연결 주소는 Dashboard Connect에서 확인하세요. 스키마 마이그레이션의 session lock에는 direct/session pooler가 필요하고 런타임은 transaction pooler를 사용할 수 있습니다.

## 권한과 세션

마이그레이션001~005는 앱·근거·공개 스냅샷, 관리 작업, 가져오기, 수집·제보, 아이콘 메타데이터를 관리합니다. 적용된 SQL을 변경하지 말고 후속 migration을 추가하세요. 체크섬·lock·rollback으로 실패와 재실행을 처리합니다.

앱 쿼리는 트랜잭션마다 `SET LOCAL ROLE anon/authenticated`와 검증된 claims를 사용하며 RLS와 관리자 허용 목록을 검사합니다. 운영 인증은 정확한 토큰의 `getUser()` 검증과 `auth.sessions`의 존재·만료 확인을 거칩니다. `/api/admin`에도 SSR 세션 갱신·no-store가 적용됩니다. `app_private`, `submission_ingress`를 Data API 노출 스키마에 추가하지 마세요.

제보는 비공개이며 방문자 쿠키 해시별5회/시간, 전체60회/시간으로 제한합니다. 연락처·원본 IP는 저장하지 않습니다. 로컬 `collect` 워커는 loopback과 로컬 관리자만 사용하며 운영에서 실행하지 않습니다. 운영 Cron은 별도 검토 전까지 비활성입니다.

## 검증과 이전

- `test:db`: 임시 `duo_test_*` DB에 migrations/RLS/트랜잭션/이전 검사 후 정리.
- `test:admin`: 임시 DB·랜덤 관리자 및 별도3350 서버.
- `test:e2e`: 명시적 fixture와3351 서버. 기본 명령은 순차 실행.
- `DUO_TEST_PORT=3360`처럼 포트를 지정하면 `.next-test-<port>`로 빌드·결과도 분리.
- `test:production`, `test:production:db`: 빌드된 서버의 공개 경계 검사. 실제 Vercel 검증과 구분.
- `release:export/setup/transfer-data/transfer-icons/check`: 전용 환경 파일, 명시적 target/ref, 기본 dry-run. [출시·복구 안내](release.md) 참고.

실제 외부 검증과 미완료 항목은 [검증 기록](verification.md)에 남깁니다. 운영 데이터·계정·키는 저장소에 포함하지 않습니다.
