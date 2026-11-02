# AdSense — 자동 광고 전용

업데이트: 2026-11-02. 사용자 요청에 따라 고정 광고 공간을 제거하고 기존 프로젝트의
자동 광고 설정·개인정보 안내·계정 제외 설정·운영 활성화를 반영했다.

## 현재 운영

- 게시자: `ca-pub-8224851078290204`. 인증 메타 태그와 `public/ads.txt`를 유지한다.
- `next/script`의 `lazyOnload`로 광고 로더를 문서당 한 번 실행한다. Next.js의
  `afterInteractive` 사전 로드가 제외 페이지의 프리페치에서 발생하지 않도록 한다.
- 실제 콘텐츠가 있는 홈·앱 상세·변경 목록에만 로더를 연결한다. 가상 데이터·로컬·Preview,
  빈 결과·조회 실패·관리자·제보·개인정보 안내·지원 기준·404에는 새 광고 코드를 넣지 않는다.
- Production의 `ADSENSE_AUTO_ADS_ENABLED=true`를 추가했다. 실제 Production/PostgreSQL/
  HTTPS origin 조건도 필요하다. 다른 환경에는 활성화 값을 추가하지 않았다.
- 자동 광고 운영에서는 내부 페이지·검색·필터·페이지 번호 이동을 새 문서로 연다.
  이전 Google 스크립트·타이머·프레임이 제외 화면에 남지 않도록 한다. URL/언어 상태와
  디렉터리 앵커를 유지하며, 해시·외부·새 탭 링크는 기존 동작을 유지한다.
- 수동 `ins.adsbygoogle`, `data-ad-slot`, `adsbygoogle.push`는 사용하지 않는다.
  계정의 기존 수동 단위 `IsDuoReady / 2712791143`은 사용하거나 삭제하지 않았다.
- 공개 정책: [한국어](https://is-duo-ready.vercel.app/ko/privacy),
  [English](https://is-duo-ready.vercel.app/en/privacy). 푸터에서 접근할 수 있다.

## 저장한 계정 설정

- 자동 광고 및 자동 최적화: 사용. 기존 광고 형식 설정을 유지한다.
- 제외된 페이지: **8개**. ko/en 각각 `/admin`과 하위 경로, `/submit`, `/privacy`,
  `/methodology`를 섹션 접두사로 저장했다. 사이트 설정 적용 후 목록의 8개를 확인했다.
- 기존 유럽 동의 메시지: `https://is-duo-ready.vercel.app/en/privacy`를 정책 URL로
  저장하고 변경사항을 게시했다. 메시지 목록의 **게시됨**, 실제 수정일 2026-11-02를 확인했다.
  영어 및 기존 31개 언어, 동의·거부·옵션 선택을 유지했다. 다른 사이트는 변경하지 않았다.
- Google 안내상 변경 전파에는 최대 1시간이 걸릴 수 있다.

## 실제 운영 확인과 남은 외부 상태

- 최신 배포 `dpl_9rAemkmHAXanuMRgFw6W4xT7cQJC`, 소스 `8f21e8a`의 원격 기본 빌드가
  통과했다. 정책 및 홈 응답을 확인한 후 기존 도메인으로 승격했다.
- 브라우저의 ko/en 홈에서 올바른 게시자 로더와 Google 후속 스크립트를 확인했다.
  사이트에서 만든 수동 슬롯은 0개다. Google의 광고 요청 프레임도 생성됐다.
  이것은 광고 소재가 실제 게재됐다는 증거가 아니다.
- 광고 홈 → ko/en 정책, 홈 → 제보, 홈 → 빈 검색 결과에서 광고 스크립트·프레임 0개를
  확인했다. 빈 검색 URL은 검색어와 `#directory-heading`을 유지했다. 지원 기준,
  관리자 로그인, 없는 앱 화면에도 광고 스크립트·프레임이 없었다.
- 공개 `/ads.txt`는 `google.com, pub-8224851078290204, DIRECT, f08c47fec0942fa0`을
  제공한다. 그러나 계정은 여전히 **찾을 수 없음**으로 표시했다. 수집 완료를 주장하지 않는다.
- 사이트는 **준비 중 / 광고 게재 가능 여부 검토 중 / 리뷰가 요청됨**이다.
  Google의 승인과 실제 광고 소재 송출은 아직 확인할 수 없다.
- 공식 `?fc=alwaysshow&fctype=gdpr` 테스트를 실행했으나 동의 창과 Funding Choices
  스크립트는 관찰되지 않았다. 게시 상태와 실제 표시를 구분한다. 전파 후 및 승인 후
  동의·거부·재설정, 재방문과 지역별 동작을 다시 확인해야 한다. 현재 테스트만으로
  미표시 원인이 승인 대기인지 전파인지 단정하지 않는다.
- 브라우저에는 기존 Three.Clock 경고와 Google의 `data-nscript` 비지원 경고가 있었다.
  게시자 SDK 및 후속 광고 요청 실행은 확인했으며 이 경고를 해결했다고 주장하지 않는다.

추가 크롤링 점검에서 검색 비활성 robots의 ads.txt 접근 보완점을 발견해 운영에 반영했다.
자동 광고가 활성화된 실제 운영에만 정확한 `/ads.txt$`를 허용하고 광고·사이트 확인 봇의
공개 경로 규칙을 명시했다. 검색 noindex·빈 sitemap·관리자/API·비운영 차단은 유지한다.
Google 광고 봇은 wildcard 차단을 무시하는 경우가 있어 이전 규칙이 모든 검토를 막았다고
단정하지 않는다. 계정을 새로 조회해도 검토 중/찾을 수 없음이었고, 현재 UI에는
업데이트 확인 버튼이 없었다. 수동 재수집 요청을 실행한 것으로 기록하지 않는다.

새 Whale 시크릿 창의 실제 Network 기록에서 광고 SDK와 광고 요청은 HTTP 200이었다.
광고 응답은 빈 HTML이었고 Funding Choices 요청은 0/71개였다. 콘솔에는 앞서 기록한
두 경고만 표시됐다. 계정의 게시된 메시지·선택 사이트·HTTPS 정책 URL을 다시 읽어 확인했다.
Google이 동의 메시지를 내려주지 않은 정확한 원인은 미확정이며 승인이 자동 해결한다고
주장하지 않는다. 동의·거부·철회와 실제 광고 소재는 여전히 후속 검증이 필요하다.

검증과 롤백 정보는 [출시 기록](adsense-launch-2026-11-02.md),
최신 배포·수집 및 동의 진단은 [크롤링 후속 기록](adsense-crawl-2026-11-02.md)에 기록했다.

## 공식 출처

- [자동 광고 설정](https://support.google.com/adsense/answer/9261307?hl=en)
- [자동 광고 코드](https://support.google.com/adsense/answer/9274634?hl=en)
- [광고 제외 페이지 설정](https://support.google.com/adsense/answer/9262311?hl=en)
- [동의 메시지 정책 URL](https://support.google.com/adsense/answer/10961370?hl=en)
- [동의 메시지 테스트](https://support.google.com/adsense/answer/10924669?hl=en)
- [Google의 자동 동의 철회 링크](https://support.google.com/adsense/answer/10959060?hl=en)
- [게시자 개인정보 고지](https://support.google.com/publisherpolicies/answer/10502938?hl=en)
- [Google 인증 CMP 요구사항](https://support.google.com/adsense/answer/13554116?hl=en)
