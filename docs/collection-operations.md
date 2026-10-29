# 005 수집·검토·제보 운영

005는 로컬 PostgreSQL에서 검증하는 기능이다. 외부 프로젝트 생성, 배포, 운영 Cron 활성화는 포함하지 않는다.
운영 스케줄러 연결은 006이며 Supabase Cron + Edge Functions를 기본 검토 대상으로 유지한다.

## 출처 등록과 실행

1. 관리자에서 대상 앱을 만들거나 가져온 뒤 `/ko/admin/collections` 또는 `/en/admin/collections`를 연다.
2. KR App Store URL 또는 공식 웹 문서를 등록한다. 공식 출처와 이용 조건을 확인한 내용 및 확인 체크가 필요하다.
3. KR App Store 어댑터는 대상 앱 ID와 URL의 ID가 일치해야 한다. 웹은 관리자가 확인한 정확한 호스트만 허용한다.
4. **지금 확인 / 재시도**는 해당 출처 1개, **확인 시각이 된 출처 1개 수집**은 due 출처 1개를 실행한다.
5. 정기 로컬 실행은 별도 터미널에서 아래 명령을 사용한다. 기본 주기는 하루이며, worker가 켜져 있을 때 실행한다.

```sh
npm run collect                # 실행 시각이 된 출처 최대 5개
npm run collect -- --watch      # 1분마다 최대 5개 확인; Ctrl-C로 종료
```

워커는 로컬 DB와 활성화된 로컬 관리자만 사용한다. `VERCEL`, `VERCEL_ENV`, production 환경에서는
실행하지 않는다. 운영 스케줄러를 별도로 활성화하거나 Codex 예약 작업을 생성하지 않았다.
배포 시에는 스케줄러를 하나만 선택하고 전용 실행 신원·비밀키·프로젝트 분리를 검증해야 한다.

## 수집의 경계

- API와 웹 파서는 별도다. Apple API는 004의 고정 KR Lookup과 3초 간격을 재사용한다.
- DB에서 실행을 먼저 커밋하고, 5분 lease로 중복 실행을 방지한다. 중단 실행은 다음 claim에서 abandoned로 남긴다.
- 시도 횟수도 HTTP 전에 커밋한다. 요청별 8초 제한, 최대 2회 재시도와 지수 백오프를 둔다.
- 웹은 DNS부터 본문까지 8초, 2MiB 제한을 적용한다. 공인 IPv4만 연결하고 DNS 확인 결과를 TLS 연결에 고정한다.
  Host/SNI/인증서 검증은 원래 호스트를 유지한다. 리디렉션·압축 응답·지원하지 않는 콘텐츠 유형은 거부한다.
- 웹은 robots.txt를 먼저 확인한다. 404는 허용, 정상 text/plain 규칙을 해석하며 적용되는 Disallow가 Allow보다 우선한다.
  3초보다 긴 Crawl-delay, robots 리디렉션/오류/확인 불가를 보수적으로 거부한다. 이 정책은 접근 가능한 출처를 줄일 수 있다.
- JavaScript 렌더링 페이지나 IPv6 전용 출처는 자동 수집 범위 밖이다. 원문을 수동 조사하고 제보/편집 경로로 보완한다.
- HTML은 실행하지 않고 텍스트로 비교한다. 최대 20,000자 발췌와 전체 정규화 텍스트 해시를 저장한다.
- 최초 성공도 후보로 저장한다. 해시는 조회 시각을 제외하고 버전·릴리스 노트/내용으로 계산한다.
  관측은 보존하고 마지막 성공 관측을 별도로 추적하므로 예전 내용이 재등장해도 마지막 비교 기준을 잃지 않는다.
- 기각한 동일 관측은 새 후보가 되지 않는다. 내용이 바뀌거나 새로운 출처/근거가 들어오면 별도 후보로 검토한다.
- 수집 성공·실패 모두 공개 정보, 사람의 검토일, 기존 근거, 앱 초안을 자동 수정하지 않는다.
  3회 이상 연속 실패를 관리자에 표시한다. HTTP 404도 앱 삭제나 미지원 판정으로 해석하지 않는다.

## 검토와 제보

검토 화면에서 현재 공개 정보, 새 후보, 이전 성공 관측, 저장된 수정안을 비교한다.
앱 편집 화면에서 상태·공식 근거·버전·설명을 저장한 뒤 검토 화면을 다시 열어 승인한다.
후보 문구는 공식 근거로 자동 복사되지 않는다. 승인에는 명시적 확인과 사유가 필요하다.

승인은 기존 `publish_app`의 공식 근거 검증과 함께 공개 스냅샷·지원 이력·감사·검토 완료를
하나의 트랜잭션으로 반영한다. 검토 또는 앱 revision이 오래되었으면 충돌로 거부한다.
보류·기각 사유는 비공개다. 승인 사유는 기존 공개 변경 이력의 사유로 사용한다.
승인·기각은 종료 상태이며, 정정이 필요하면 새 후보나 기존 앱 정정 흐름으로 기록한다.

`/{locale}/submit?app=<slug>`는 공개 앱만 조회하여 KR URL을 채운다. 앱 추가와 정정 모두
KR 앱 URL·10~4,000자 내용·HTTPS 근거 URL이 필요하다. 연락처는 받지 않으며 개인정보를 넣지 않도록 안내한다.
제보의 앱이 아직 없으면 가져오기/편집기로 먼저 만들고, 같은 App Store ID의 앱만 연결할 수 있다.

제보 접수는 서버 액션의 고정 필드 검증 후 `submission_ingress.accept`만 호출한다.
이 스키마를 Supabase Data API 노출 목록에 추가하지 않는다. 좁은 SECURITY DEFINER 함수는
검증·원자적 제한·비공개 저장만 수행하며, anon에 테이블 조회나 직접 쓰기 권한을 부여하지 않는다.
브라우저의 임시 무작위 httpOnly 쿠키 해시별 시간당 5회, 사이트 전체 시간당 60회로 제한한다.
쿠키 교체로 사이트 전체 제한을 우회할 수 없다. 원본 IP와 연락처는 저장하지 않는다.
실서비스 공개 전 006에서 봇 대응·프록시 신뢰 경계·적정 접수량과 운영 정책을 재검토한다.

## 검증 근거

- `tests/unit/collection.test.ts`: URL/DNS/핀 고정/리디렉션/robots/본문 크기·시간/재시도/hosted 워커 차단.
- `tests/unit/submission.test.ts`: 필드·KR URL·길이·honeypot·파일 입력·위조 상태 제외.
- `tests/integration/operations.test.mjs`: 중복·기각·lease 복구·실패 보존·역할 격리·동시 제한·승인 원자성·durable worker.
- `tests/e2e/operations.spec.ts`: 제보→수집→보류→편집→승인, 새 앱 연결, 익명/권한 회수 후 액션 재호출,
  ko/en·light/dark·360/768/1440·axe·키보드.
- 실제 실행 결과는 [검증 기록](verification.md)에 기록한다. 테스트 가상 출처는 임시 DB에만 존재한다.

설계 참고: [Node HTTPS](https://nodejs.org/api/https.html),
[OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html),
[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/17/sql-createfunction.html).
