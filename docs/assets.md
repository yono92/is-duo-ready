# Asset register

## Interactive concept — 2026-10-29

- `src/components/device-scene.tsx`: 저장소에서 작성한 Three.js 기하 모형. 베벨 프레임, 두 패널·힌지, 렌즈·버튼·커버 화면을 포함한다. 실측 치수나 공식 사양을 주장하지 않는다. 공식 로고·외부 모델 파일은 사용하지 않는다.
- `public/device/duo-wallpaper.webp`: 내장 image_gen으로 생성한 독립적인 사막 풍경. 1440×1080 WebP, 약 200 KiB. 기존 렌더나 공식 사진에서 추출하지 않았다. 프롬프트는 일반적인 모래 언덕·산맥·푸른 하늘의 제품용 사진 질감 배경이며 브랜드 월페이퍼 재현을 제외했다. 예시 배경으로만 사용한다.
- 생성 원본: `$CODEX_HOME/generated_images/01a18739-396c-7a40-aa85-15939a7018a8/exec-1d0a965d-508b-41bf-ae07-ce60d398c278.png`. 런타임은 저장소의 WebP만 참조한다. 원본은 보존했다.
- Three.js, React Three Fiber, Drei는 MIT 라이선스이며 고정 버전은 package.json/lock에 있다. 조명 환경은 코드의 Lightformer와 구체로 직접 구성하여 외부 HDR/CDN에 의존하지 않는다.
- `DevicePreview` ko/en 메시지에 접근 가능한 조작 이름·콘셉트 안내·대체 이미지 안내를 둔다. 기기는 장식 캔버스로 처리하고 조작은 DOM 컨트롤에서 제공한다.
- 이전 CSS 모형과 SVG 풍경은 제거했다. 기존 PNG는 로딩/미지원/컨텍스트 손실 시 대체 이미지로 보존한다. 홈은 기존 `deviceAsset` 게이트를 유지하며 Vercel 또는 로컬 원본이 없는 환경에서는 표시하지 않는다. 기존 PNG의 공개 사용 권리는 계속 미승인 상태다.

| Asset | Source | Rights / status | Dimensions | Alternative text |
| --- | --- | --- | --- | --- |
| /device/iphone-duo-render.png | Built-in image_gen, 2026-10-29, informed by official product photographs; prompt and reference URLs in docs/references/duo-render-prompt.md | Local visual prototype only; generated render, not official artwork. Public-use rights have NOT been cleared. AI generation is not a license to Apple's source artwork or product branding. | 1536 × 1024, PNG with alpha | Home.deviceAlt in ko/en dictionaries |
| /device-placeholder.svg | Original SVG authored in this repository, 2026-10-29 | Development schematic placeholder; no Apple artwork, logo, product photograph or real app screenshot. Final asset requires review before launch. | 640 × 400 | Home.deviceAlt in ko/en dictionaries |
| App icon tiles | lucide-react, ISC licensed package | Generic symbolic icons for fictional apps, not app trademarks | 48 × 48 tile | Decorative, adjacent app name provides meaning |

Replace the path and dimensions in src/lib/device-asset.ts, then update this register with source URL,
license/permission and localized alt text. Keep the generated-image and screen-example caption.
The active render approximates the product appearance; it is not a dimensional CAD model, an official
product photograph, or evidence that any app supports the device. The earlier schematic is retained
as an unused fallback asset. Reference photographs remain outside the repository and are not served.

## Public-use review — 2026-10-29

Apple's [third-party guidelines](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html)
require express written permission for photographs Apple owns or licenses. Their compatibility
promotional-use provision specifies actual product photographs rather than artist renderings.
The policy does not establish a legal determination for this particular site; use and jurisdiction
still matter. Do not treat generation, attribution or an unofficial-image caption as rights clearance.
Before publication, resolve the final asset's permitted use (for example, permission for the exact
official image and intended use, or a reviewed original photograph). Permission requests can be made
through [Apple Rights and Permissions](https://www.apple.com/legal/contact/rights-permissions.html).
No permission request, external project or deployment was made in this task.

## 2026-10-29 — 브랜드 심볼 및 파비콘

- `public/brand/duo-mark.svg`: 이 저장소에서 직접 작성한 64×64 벡터. 파란 rounded square 안의 두 패널과 오른쪽 체크로 듀얼 화면/준비 여부를 표현한다. Apple 로고나 외부 앱 상표를 사용하지 않는다.
- `src/app/icon.svg`: 같은 원본으로 만든 브라우저 파비콘. Next.js 파일 기반 metadata가 `/icon.svg`를 연결한다.
- `src/components/brand-mark.tsx`: 헤더 워드마크와 결합하는 장식 아이콘으로 alt를 비우며, 링크 이름은 서비스명 텍스트가 제공한다.
- 헤더 심볼을 변경하면 파비콘도 동일한 원본으로 함께 갱신한다.

## 004 — App Store 메타데이터와 아이콘 (2026-10-29 갱신)

기존의 URL만 저장하던 구현을 대체했다. Apple KR Lookup의 아이콘 URL을 서버가 수집하고,
원본 바이트를 변형 없이 `.data/app-icons/<sha256>.<extension>`에 저장한다. PostgreSQL의
`public.app_icon_assets`에는 원본 URL, 해시, 크기, 형식, 치수, 수집 시각을 기록한다.
브라우저는 외부 아이콘 URL을 호출하지 않고 우리 이미지 API로 읽는다. 원본 URL은 출처와
갱신에만 사용한다. 실제 로컬 앱 128개의 파일을 수집했으며 앱은 모두 초안으로 유지했다.

| 자산 | 출처 | 사용 조건 및 표시 | 치수 / 대체 텍스트 |
| --- | --- | --- | --- |
| 실제 앱 아이콘 원본 | Apple KR Lookup의 Apple `mzstatic.com` URL; 앱별 URL과 해시는 DB 기록 | 아래 Search API의 판촉 목적과 해당 앱 직접 링크 조건 적용. 원본을 변형하지 않고 소유권을 주장하지 않는다. 초안은 관리자만 접근 | 원본 치수는 DB 기록, 화면 48×48; 옆 앱 이름과 중복되므로 장식 이미지 |
| `public/badges/app-store.svg` | [Apple 공식 배지 원본](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg), 2026-10-29 수집 | 원본 SVG 그대로 사용. 해당 앱으로 직접 연결. 높이 40px, 여백 10px 적용 | 120×40 표시, `AppAssets.badgeAlt` 및 `storeLink` ko/en |

[Apple Search API 조건](https://performance-partners.apple.com/search-api)은 앱 아이콘 등 판촉
콘텐츠를 해당 콘텐츠 판촉과 직접 연결하는 용도로 제공하며, 인접한 App Store 배지와 해당 앱의
직접 스토어 링크를 요구한다. 이 구현은 아이콘을 앱 안내와 해당 앱의 스토어 이동에 사용한다.
오디오/비디오 샘플의 스트리밍 제한을 앱 아이콘 파일에 동일하게 적용한 것으로 해석하지 않는다.
[App Store 마케팅 지침](https://developer.apple.com/app-store/marketing/guidelines/)에 따라
배지 원본을 변경하지 않고 최소 크기와 여백을 유지한다. 이 판촉 용도의 조건 검토가 기기 렌더 등
다른 자산의 권리 해결을 의미하지 않는다. 아이콘 수집은 지원 판정이나 사람의 검토가 아니다.

이전 10개 API 실조회의 필드·시각·출처는 `docs/import-validation.md`와
`tests/fixtures/apple-observed.json`에 있다. 초기 메타데이터 수집은 `docs/initial-data.md`에
기록했다. 파일은 Git에서 제외하며 로컬 저장소와 DB를 함께 백업해야 한다.
006에서 private Supabase Storage 어댑터와 해시 검증 이전을 구현했습니다. 운영용 is-duo-ready 프로젝트의 app-icons 버킷에 원본 128개를 이전하고 내려받은 바이트의 일치를 확인했습니다. 브라우저는 기존 서버 이미지 API의 인증/RLS 경계를 유지합니다.

## 006 — 개발 기기 렌더 배포 제외

원본은 `assets/development/iphone-duo-render.png`로 이동했습니다. 로컬 전용 `/device/iphone-duo-render.png` 라우트는 Vercel에서 404를 반환하고 홈에서도 제외됩니다. `.vercelignore`가 원본 폴더를 업로드에서 제외합니다. 이 조치는 공개 사용 권리 승인을 의미하지 않습니다.

## 2026-10-29 — 링크 공유 이미지

- `/api/og/ko`, `/api/og/en`: 저장소에서 직접 작성한 1200×630 PNG 카드. 기존 자체 제작 듀오 심볼과 서비스 설명만 사용하며 Apple 사진·로고·실제 앱 아이콘·지원 수치·확인 날짜를 포함하지 않는다. `src/messages/seo.ts`의 언어별 `image` 문구와 대체 텍스트를 사용한다.
- `src/lib/seo/assets/NanumGothic-Regular.ttf`: [Google Fonts 원본](https://github.com/google/fonts/blob/main/ofl/nanumgothic/NanumGothic-Regular.ttf)을 2026-10-29 내려받아 변경 없이 보관했다. NHN Corporation 저작권, SIL Open Font License 1.1이며 동봉된 `OFL.txt`에 원본 고지와 라이선스를 보존한다. SHA-256: `76f45ef4a6bcff344c837c95a7dcc26e017e38b5846d5ae0cdcb5b86be2e2d31`, 2,054,744 bytes.
- `src/lib/seo/assets/NanumGothic-ExtraBold.ttf`: [같은 글꼴의 ExtraBold 원본](https://github.com/google/fonts/blob/main/ofl/nanumgothic/NanumGothic-ExtraBold.ttf), 같은 저작권·SIL OFL 1.1을 적용한다. 변경하지 않은 원본이며 SHA-256: `5c4568e5295a8c52bc30e7efa1ea6d2de43556268ef42daba93540a1ece691ae`, 2,112,720 bytes. 큰 두 줄 제목과 브랜드 이름에 사용한다.
- 폰트는 이미지 생성용 Node 서버에서 로컬 파일로 읽는다. 웹 페이지의 시스템 글꼴은 유지하고 이미지 요청 시 외부 폰트 서버를 호출하지 않는다. 전체 원본을 보관하여 SEO 문구의 한국어 변경에 따른 글리프 누락을 방지한다.
- 사용자의 후속 디자인 요청에 따라 inset 카드를 제거하고 흰 바탕의 비대칭 구성, 굵은 두 줄 제목, 오른쪽의 확대된 자체 제작 두 패널·체크 모티프, 하단 구분선·정보 항목·도메인으로 재구성했다. 그림자·그라디언트·공식 기기 이미지를 사용하지 않는다.
