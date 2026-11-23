# AdSense 콘텐츠 정책 반려 대응 — 2026-11-13

## 확인된 반려와 자체 진단

사용자 화면에서 소유권 확인 통과와 ‘게시자 콘텐츠가 없는 화면에 Google 게재 광고’
반려를 확인했다. Google이 지목한 개별 URL·내부 판단은 알 수 없다.
공개 HTTP 확인에서는 홈 1,521개 중 지원 정보 없음 1,251개, 지원 확인 270개였다.
ProCam 상세는 공통 미확인 안내·공식 자료 없음·공개 조사 없음·사용 경험 없음,
AdGuard Pro는 짧은 공식 인용과 요약 중심이었다. 이 표본과 광고 조건을 근거로 콘텐츠가
부족한 페이지에도 광고를 연결한 것이 주요 위험이라고 판단했다. 전체 페이지를 Google이
같은 이유로 평가했다고 주장하지 않는다.

robots.txt·ads.txt·홈·표본 상세는 200이었다. 홈과 상세의 noindex/nofollow 및 빈 sitemap은
유지 중이다. 광고/심사 봇은 robots에 명시적으로 허용되어 있었다. ads.txt는 올바른 게시자
기록을 반환했다. 검색 색인 차단을 이번 반려의 확정 원인으로 보지 않는다.

## 변경

실제 앱 존재 여부와 콘텐츠 광고 적합성을 분리했다. 홈과 최근 변경에서는 광고 로더를
제거하고 상세는 정확한 언어별 경로의 편집 검토 기록이 있어야 허용한다. 초기 목록은
비어 있으므로 현재 모든 자동 광고를 보류한다. 추후 자체 설명·판단의 근거·확인 범위와
한계를 읽고 유용성이 확인된 페이지에만 검토 이유를 기록한다. 단어 수·지원 배지·인용
존재를 Google 승인 기준처럼 만들지 않는다. 내용이 실질적으로 바뀌면 재검토한다.

소유권 메타, ads.txt, 기존 환경 경계, robots 봇 접근, 문서 단위 탐색은 보존한다.
관리자·제보·정책·404의 광고 제외도 유지한다. 지원 안내에는 한영으로 근거를 읽는 법,
버전 차이, 미확인 상태에서의 확인 방법, 공식 발표와 사용 경험의 차이, 정정 방법을 추가했다.
DB·지원 상태·검토일·공식 인용·계정 CMP 설정은 변경하지 않았다.

## 검증 및 배포

- lint 통과: 기존 경고 3개, 오류 0개.
- typecheck 통과.
- 단위 검사 22개 파일 / 125개 통과. 운영 조건에서 미검토 상세의 로더 부재,
  언어별 허용, 빈 콘텐츠·비운영·검색·목록 차단과 기존 robots 예외를 포함한다.
- E2E: 최초 서버 시작은 sandbox의 127.0.0.1:3428 EPERM으로 실패했다.
  권한 조정 후 `DUO_TEST_PORT=3428 ADSENSE_AUTO_ADS_ENABLED=true npm run test:e2e` 45개 통과.
  한영 지원 안내의 360px 가로 넘침·제보 연결·광고 요청 부재와 기존 전체 흐름을 포함한다.
- 한영 360px 안내 스크린샷을 직접 확인했다. 추가 클라이언트 요청·상태·의존성 없이
  서버 렌더링과 기존 링크를 사용하며 React 검토에서 새 hook/접근성 문제를 발견하지 않았다.
- `npm run build`: 로컬 Turbopack의 CSS 처리에서 프로세스 생성·포트 바인딩 EPERM으로 실패했다. 이 실행을 통과로 기록하지 않는다.
- `npm run build -- --webpack`: 컴파일·타입·페이지 생성 통과.
- Vercel 원격 기본 `npm run env:check && npm run build`: Turbopack 빌드 통과.
- 변경 파일 Prettier 및 `git diff --check` 통과.

소스는 `ea0660ca2bdd100f6ebfb7b6f8ae5ddc249f7e69` archive에 이번 제품 소스 11개만 덮어쓴
격리 디렉터리다. dry-run에서 301개 업로드 파일을 확인했고 로컬 .env·.data·.git·output·
node_modules는 포함되지 않았다. 원래 체크아웃의 병행 변경은 업로드하지 않는다.
이전 운영/복구 대상은 `dpl_66FMerb9ievhM26CjVnxqhek3ryi`다.

로컬 로그: `/tmp/duoready-ads-remediation-{lint,types,unit,e2e,e2e-retry,build}.log`.
배포 파일 해시: `/tmp/duoready-ads-remediation-manifest.json`.

## 남은 판단

광고를 끄고 안내를 보강한 것과 Google의 콘텐츠 적합성·승인은 별개다. Google 재심사는
실행하지 않았으며 승인·실제 광고 송출·CMP 동작을 새로 검증한 것으로 기록하지 않는다.
앱별 자체 콘텐츠 보강과 광고 재개 대상의 편집 검토는 008 T016으로 남긴다.

## 공식 정책

- [게시자 콘텐츠가 없는 화면](https://support.google.com/publisherpolicies/answer/11112688?hl=ko)
- [복제 콘텐츠와 추가 가치](https://support.google.com/publisherpolicies/answer/11190248?hl=ko)
- [애드센스 광고/사이트 확인 크롤러](https://support.google.com/adsense/answer/99376?hl=ko)


## 운영 반영

기존 프로젝트 `prj_v8eqflVjl0dsSmN9X96TyQsX3Ag7`와 팀을 CLI로 확인했다.
연결된 MCP는 같은 ID에 404를 반환해 기존 인증 CLI로 전환했다. 새 프로젝트 생성·환경
변수 변경·배포 보호 해제는 하지 않았다.

격리 소스를 `--prod --skip-domain`으로 배포한 `dpl_6W3hfmzFJdSiYvVWv1BYuqfihHvq`가
READY가 된 뒤 인증된 HTTP로 12개 경로를 검사했다. 한영 홈·미일치 검색·지원 필터·
미확인/지원 표본 상세·최근 변경·한영 안내·정책에서 광고 SDK/로더 부재와 소유권 메타를
확인했고 ads.txt의 정확한 게시자 레코드 및 robots의 광고/심사 봇 예외를 확인했다.
검증한 동일 배포를 `https://is-duo-ready.vercel.app`에 승격한 뒤 같은 12개 경로를 재검증했다.

배포 URL: `https://is-duo-ready-j3ezp5p4v-yonos-projects-8566d4cb.vercel.app`.
코드 기준은 기록된 base commit + 소스 11개 SHA-256 manifest이며 신규 Git 커밋을 만들지 않았다.
따라서 다음 배포에서도 이번 로컬 변경을 포함해야 광고 보류가 유지된다. 이전 배포로
롤백하면 기존의 넓은 광고 조건도 복원된다는 점에 유의한다.

로그: `/tmp/duoready-ads-remediation-{deploy,webpack}.log`,
`/tmp/duoready-ads-remediation-{stage,live}-results.json`.


공개 브라우저 후속 검사에서 8개 화면의 광고 요소 및 광고 도메인 요청 시도는 각각 0개였다.
광고 요청은 발생할 경우 외부로 나가지 않도록 차단했다. 한영 모바일은 로컬 E2E,
한국어 1440px 다크 안내는 실제 운영 스크린샷으로 확인했다. 콘솔에는 기존 THREE.Clock
경고가 있었다. 초기 CLI Chrome 미설치·sandbox npm DNS·진단 콜백 형식 오류 후 설치된
Chromium과 올바른 콜백으로 검증했다. 기록은 `/tmp/duoready-ads-remediation-live-browser.log`,
이미지는 `output/playwright/ads-remediation-live-ko-dark.png`다. 검증 후 작업용 브라우저만 닫는다.
