# Validation quickstart: 003-public-directory

1. Node 22 환경에서 `npm ci`, `npm run db:start`를 실행한다. 기존 `.env.local`은 보존한다. 없는 경우에만 `npm run db:env`를 사용한다.
2. `npm run db:migrate`로 로컬 마이그레이션을 적용한다. 재실행은 체크섬 검증 후 변경 없이 끝난다.
3. 최초 로컬 관리자 설정은 `npm run admin:local`이다. 비밀번호는 비공개 `.env.local`에서 확인하고 개발 서버를 재시작한다. `/ko/admin/login` 또는 `/en/admin/login`에 접속한다. 현재 작업 컴퓨터는 설정 완료 상태다.
4. 스토어 URL/CSV 가져오기 → 비공개 초안·근거 제안 → 원문/번역과 공식 근거 편집 → 명시적 공개 → 공개 검색/상세/이력 → 정정/주소 변경/보관을 확인한다. 수집만으로 공개 판정·검토일을 변경하지 않는다.
5. `npm run test:db`와 `npm run test:admin`은 별도 임시 DB에서 권한·실패·중복·전체 흐름을 검사하고 정리한다. 가상 테스트 근거를 일반 앱 DB에 넣지 않는다.
6. `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run test:production`, `npm run test:production:db`, `npm run format:check`를 실행한다. 관리자 E2E와 fixture E2E는 `.next-test`를 공유하므로 순차 실행한다.
7. 실제 API 재검증은 `npm run test:apple`이다. 실제 앱 10개 메타데이터를 읽고 관찰 기록만 갱신한다. 지원 근거·검토일·공개 판정은 만들지 않는다.
8. [환경 안내](../../docs/environments.md)와 [검증 기록](../../docs/verification.md)을 확인한다. 로컬 성공은 외부 Supabase Auth/SQL/TLS 또는 Vercel 검증을 의미하지 않는다. 외부 프로젝트·배포·실제 앱 약 100개 조사 및 자산 권리 검토는 후속 범위다.
