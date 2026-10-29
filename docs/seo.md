# 공유 미리보기와 SEO 관리

## 문구를 바꾸는 곳

`src/messages/seo.ts`가 공통 설정 파일이다. 한국어와 영어를 같은 파일에서 관리한다.

| 설정 | 적용 위치 |
| --- | --- |
| `siteName` | OG 사이트 이름, 구조화 데이터, 상세·보조 페이지 제목, 이미지 브랜드명 |
| `locales.ko/en.home` | 홈 검색 제목·설명과 OG/Twitter 카드 제목·설명 |
| `locales.ko/en.updates/methodology/submit` | 페이지별 제목·설명 |
| `locales.ko/en.appTitle/appDescription` | 앱 상세 제목과 설명이 없는 앱의 대체 문구. `{name}`은 앱 이름 |
| `locales.ko/en.image` | 공유 이미지 제목·설명·하단 항목·대체 텍스트 |
| `imageVersion` | 이미지 URL의 `v` 값. 이미지 문구나 디자인 변경 시 올린다 |
| `verification.google/naver/bing` | 해당 검색 서비스에서 발급받은 HTML 소유권 확인 값. 미설정 시 태그 없음 |
| `productionOrigin` | `NEXT_PUBLIC_SITE_URL`이 없는 경우 사용할 기본 주소 |

문구는 일반 텍스트로 작성한다. 이미지 제목은 두 줄, 설명은 짧은 한 문장을 권장한다.
사이트명과 홈 제목은 별도 문구이므로 이름을 변경하면 둘 다 확인한다.
앱 상세 설명은 DB의 현재 번역을 사용하며, 번역이 없거나 재검토 상태이면 기존 화면과 같은
원문 fallback을 적용한다. 긴 설명은 180자까지 줄이며 지원 판정·검토일을 새로 만들지 않는다.

## 공유 카드

- 이미지 확인: `/api/og/ko?v=2`, `/api/og/en?v=2` (1200×630 PNG).
- Next.js `ImageResponse`가 자체 브랜드 도형과 로컬 Nanum Gothic 글꼴을 렌더링한다.
  DB·외부 폰트 서버·권리 미확인 기기 사진에 의존하지 않는다.
- 홈·업데이트·지원 안내·제보·앱 상세마다 올바른 제목과 URL을 지정한다. 이미지는 언어별 공통
  브랜드 이미지이며 앱별 가짜 스크린샷이나 지원 인증 이미지를 만들지 않는다.
- `htmlLimitedBots: /.*/`로 메타데이터를 최초 HTML `head`에 넣는다. 카카오 등 JavaScript를
  실행하지 않는 수집기에 대응하며, 메타데이터 조회 완료까지 초기 응답이 기다리는 tradeoff가 있다.
- 공유 서비스가 기존 결과를 캐시하면 배포 후 해당 서비스의 링크 재수집/캐시 초기화가 필요할 수 있다.
  `imageVersion`은 이미지 URL을 갱신하며, 공유 서비스 자체의 페이지 캐시를 강제로 지우지는 않는다.

## 검색 공개

기존 안전 설정을 유지한다. 다음 조건이 모두 충족될 때만 검색 색인과 사이트맵을 허용한다.

```text
PUBLIC_INDEXING=true
NODE_ENV=production
VERCEL_ENV=production
DIRECTORY_DATA_SOURCE=postgres
NEXT_PUBLIC_SITE_URL=https://is-duo-ready.vercel.app
```

`PUBLIC_INDEXING=false`이면 검색용 `noindex`와 robots 차단을 유지한다. 실제 운영 환경의
공유 수집기만 별도 robots 규칙으로 공개 페이지와 OG 이미지에 접근할 수 있다. 로컬·fixture·Preview는
전체 robots 차단을 유지한다. 관리자와 비공개 API의 인증은 robots 정책과 무관하게 계속 적용된다.

검색 공개를 결정하면 배포 환경의 `PUBLIC_INDEXING`을 변경하고 재배포한 뒤 실제 HTML과
`/robots.txt`, `/sitemap.xml`을 확인한다. 사이트맵에는 공개 앱·홈·업데이트·지원 안내만 포함하며
각 경로의 ko/en/x-default 링크를 제공한다. 실제 검토일 외 임의 날짜를 넣지 않는다.

Google Search Console·네이버 서치어드바이저·Bing Webmaster Tools는 소유 계정에서 등록하고,
발급받은 **HTML 태그의 content 값만** `verification`에 넣는다. 계정 비밀번호/API 비밀 키를 넣지 않는다.
코드 수정만으로 외부 서비스 소유권 인증이나 사이트맵 제출이 완료되는 것은 아니다.

## 검증

```sh
npm test -- tests/unit/seo.test.ts
npm run test:e2e -- tests/e2e/seo.spec.ts
```

전체 회귀 검사는 `docs/verification.md`를 참고한다. 배포 후 `/ko`와 `/en`의 raw HTML에서
`og:title`, `og:description`, `og:image`, `twitter:card`, canonical, hreflang과 robots를 확인하고,
이미지 URL이 인증 없이 PNG로 응답하는지 확인한다.

구현 기준: [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
[ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response).
