# 설계

- 데이터: 기존 `src/data/support-research-*.json` 방식처럼 정적 JSON을 쓴다.
  - `src/data/support-reports.json`: 갱신별 날짜·수치·지원 앱(App Store ID·구분·지원 버전·원문·요약)과
    한영 편집 분석. `.data/refresh-*/reviewed-*.json`에서 생성하고 분석 문장은 사람이 읽고 쓴다.
  - `src/data/source-scans.json`: 최신 갱신(11-23) 공개 앱별 확인 결과. `.data/refresh-2026-11-23`의
    페이지·Lookup·후보·결정·재확인 기록에서 스크립트로 생성한다. 다음 갱신 때 다시 생성한다.
- 조회: `postgres-query.ts`에 App Store ID 목록으로 공개 앱 요약을 읽는 함수와 같은 카테고리 지원 앱 조회를 추가한다.
  fixture 모드에서는 리포트에 정적 이름만 표시하고 링크하지 않는다.
- 라우트: `[section]`에 `about`을 추가하고 `reports/page.tsx`, `reports/[date]/page.tsx`를 만든다.
  헤더에 리포트, 푸터에 소개·리포트를 추가한다. 모든 UI 문구는 messages, SEO 문구는 `seo.ts`.
- 광고: `autoAdsAllowed`의 경로 형식을 `/(ko|en)/(apps/slug|methodology|reports/YYYY-MM-DD)`로 넓히고
  지원 안내·리포트 상세에 `AutoAds`를 둔다. 검토 목록에는 실제로 읽고 이유를 기록한 경로만 넣는다.
- 색인: `appMetadata`는 공개 상태가 unknown이면 index=false. sitemap은 지원 확인·예정 상세와 소개·리포트를 포함한다.
- 원칙 점검: 근거 기반 판정·수집과 승인 분리(확인 내역은 판정 변경 없음)·공개/비공개 분리(공개 앱만 링크)·
  언어/테마/화면 동등성·이력 보존·재현 가능(생성 스크립트 보존)·fixture 정직성(가상 앱에 확인 내역 없음).
