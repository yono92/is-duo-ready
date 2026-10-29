# Asset register

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
