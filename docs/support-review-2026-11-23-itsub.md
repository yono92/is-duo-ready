# itsub 목록 대조 재조사 — 2026-11-23

사용자 요청으로 제3자 목록 [itsub.cc/forduo](https://itsub.cc/forduo/)를 발견 경로로 삼아 우리 공개 판정과 대조했다.
itsub은 빌드 SDK 기준(27.1 이상 ‘iPhone Duo 호환’, 27.0 ‘오른쪽 여백’, 그 미만 ‘일반 스마트폰 비율’)으로 표시하며
앱별 근거·확인 시각은 공개하지 않는다. itsub 표시는 판정 근거로 쓰지 않았고 데이터를 복제하지 않았다.

- itsub 페이지: 자동 요청이 HTTP 403이라 사용자 지시로 로컬 Whale 헤드리스 렌더링 DOM을 읽었다. 앱 96개(호환 37·
  여백 16·일반 42·호환/일반 이중 표시 1). 네이버지도는 같은 페이지에서 ‘호환’과 ‘일반’으로 동시에 표시됐다.
- 우리 상태: 운영 공개 상세(`is-duo-ready.vercel.app/ko/apps/app-{id}`)를 읽었다. 96개 중 50개 공개, 46개 미등록.
- 재조사 대상 35개(A 19·B 13·C 3)의 한국 App Store 제품 페이지를 오늘 다시 수집했다:
  `docs/data/itsub-review-pages-2026-11-23.json` (35개 성공, 버전 기록 832건, DB 쓰기 없음).
  Apple 뉴스룸 [iPhone Duo 앱 경험 발표](https://www.apple.com/kr/newsroom/2026/10/developers-bring-incredible-new-app-experiences-to-iphone-duo/)
  (2026-10-22 업데이트)에서 대상 앱 언급도 확인했다.

첫 판정 뒤 Python 확인식 `\bduo\b`가 “Duo의”처럼 한글 조사가 붙은 문구를 놓친 것을 발견해 35개를 다시 확인했다.
For Reel이 추가됐고 Moshi 근거를 더 구체적인 문구로 바꿨다. 저장소 JS 수집식은 영향이 없다.

판정은 새 [부분 대응 정책](../specs/012-partial-support/spec.md)을 따른다. 검토 manifest는
`.data/itsub-review-2026-11-23/review-manifest.json`이며 운영 반영 전이다(`reviewed: false`).

## 반영 후보 11개

| 앱 | 판정 | 근거 버전 | 공식 원문 | 출처 |
| --- | --- | --- | --- | --- |
| [Citymapper](https://apps.apple.com/kr/app/id469463298) (미등록) | 지원 확인 | 11.53 | “Now supporting iPhone Duo.” | KR 버전 기록 |
| [Hit The Island](https://apps.apple.com/kr/app/id1644376309) (미등록) | 지원 확인 | 4.0.1 | “Added support for iPhone Duo” | KR 버전 기록 |
| [Catchtype](https://apps.apple.com/kr/app/id6822543636) (미등록) | 지원 확인 | 1.1.4 | “아이폰 듀오를 펼친 화면에서 키보드가 기본 키보드처럼 나뉘어요” | KR 버전 기록 |
| [Moshi](https://apps.apple.com/kr/app/id6757859949) (미등록) | 지원 확인 | 4.1.0 | “iPhone Duo 세로 모드에서 두 열을 나란히 표시” | KR 버전 기록 |
| [For Reel](https://apps.apple.com/kr/app/id6809392871) (미등록) | 지원 확인 | 1.7.0 | “iPhone Duo의 두 화면에 맞춰 화면을 다듬었어요.” | KR 버전 기록 |
| [젠레스 존 제로](https://apps.apple.com/kr/app/id1606356401) (미등록) | 지원 예정 | — | “젠레스 존 제로는 다음 달 iPhone Duo에 맞춰 업데이트될 예정이다.” | Apple 뉴스룸 |
| [리디](https://apps.apple.com/kr/app/id338813698) | 부분 대응 | 26.11.2 | “iPhone Duo 사용성 개선” (26.11.3에도 반복) | KR 버전 기록 |
| [네이버지도](https://apps.apple.com/kr/app/id311867728) | 부분 대응 | 6.12.1 | “iPhone Duo 사용성 개선” (6.12.2 “iPhone Duo 환경 사용성 개선”) | KR 버전 기록 |
| [CNN](https://apps.apple.com/kr/app/id331786748) | 부분 대응 | 26.23 | “We’ve made some great improvements to how the app runs on the iPhone Duo.” | 11-23 수집 |
| [그해오늘](https://apps.apple.com/kr/app/id6806797738) | 부분 대응 | 1.1.6 | “아이폰 듀오와 태블릿에서도 더 편하게 쓸 수 있도록 다듬었어요.” | 11-23 수집 |
| [페이북/ISP](https://apps.apple.com/kr/app/id369125087) | 부분 대응 | 8.7.6 | “아이폰 듀오에서 더 편하게 페이북을 이용해 보세요.” | 11-23 수집 |

- 근거 버전은 25개 관측 범위에서 같은 문구가 처음 보인 버전이며 최초 지원 버전이라는 뜻이 아니다.
- 젠레스 존 제로: Apple 발표는 11월 업데이트를 예고했지만 KR 버전 기록(3.3.1까지 24건)에는 오늘 기준 Duo 언급이 없다.
- CNN·그해오늘·페이북은 itsub 대조 대상이 아니다. 11-23 보류 32개 중 ‘Duo 명시 + 범위 불명’으로 보류했던 앱이며
  새 정책에 따라 다시 분류했다. Duo 버그 수정만 있는 앱(7개), ‘준비 중’ 문구만 있는 앱(2개), 일반 폴더블 문구와
  무관한 ‘Duo’ 용어(앱 이름·게임 모드 등)는 계속 보류한다.

## 유지 25개

- **A, 지원 정보 없음 유지 17개**: 네이버, Google, TVING, 카카오뱅크, Discord, ChatGPT, CGV, 밀리의서재, Notion,
  Spotify, 모던 바이블, 이번정거장, 에어비앤비, X, 크레페, Google Gemini, 네이버 카페. KR 설명과 최근 버전 기록
  (최대 25건)에 iPhone Duo 언급이 없고 Apple 뉴스룸에도 없다. 모던 바이블의 ‘태블릿 넓은 화면’은 Duo 문구가 아니다.
  itsub이 ‘호환’으로 표시해도 실제로 동작할 수 있다는 뜻일 뿐, 우리 근거는 아니다.
- **C, 지원 확인 유지 3개**: 네이버 웹툰(Apple 뉴스룸 근거 유지), 오늘의집(26.41.0·26.42.0 원문 재확인),
  Food Hunt(1.37 원문 재확인). 첫 화면 ‘최근 업데이트’ 표시는 오래된 값이었다. 전체 카탈로그(아래)에서는
  오늘의집 SDK 27.1·Food Hunt SDK 27.2로 ‘호환’, 네이버 웹툰은 SDK 27.0으로 ‘여백’이다. 어느 쪽도 공식 반증이 아니다.

## 신규 등록 후보 7개 (지원 정보 없음)

SOOP, 타다, Walkie, 오늘근무, 핫딜모음, 에픽세븐, Booking.com. KR 설명·버전 기록에 Duo 언급이 없다.
등록하려면 기존 신규 등록 절차(KR Lookup·아이콘·분류)를 거쳐야 한다. itsub의 나머지 미등록 33개(여백 7·일반 26)는
이번 범위에서 다루지 않았다.

## itsub 전체 카탈로그 대조

첫 화면은 일부(96개)만 보여 준다. 같은 렌더링에서 페이지가 불러오는 `forduo/api/catalog`(2026-11-22 갱신, 앱 1,613개,
앱별 빌드 SDK)를 읽었다. SDK 27.1 이상 535 · 27.0 114 · 미만 953 · 불명 11.

- **우리 DB에 있는 호환·여백 248개**: 우리 공개 상태는 지원 확인 60 · 지원 정보 없음 188. 188개를 11-23 KR 원문으로
  다시 확인했고 Duo 문구는 이미 아는 부분 대응·버그 수정 7개뿐이다. 나머지 181개는 공식 문구가 없어 그대로 둔다.
- **우리 지원 확인 307개**: 245개는 itsub 카탈로그에 없다. itsub ‘일반 비율’과 겹치는 것은
  [THE LOUNGE](https://apps.apple.com/kr/app/id1202136480) 1개(SDK 26.2, 2.2.5 노트 “iPhone Duo 대응”)뿐이다. 근거는 유지하고 충돌로 기록한다.
- 리디(26.11.2)·네이버지도(6.12.1)는 ‘iPhone Duo 사용성 개선’ 노트가 붙은 바로 그 버전부터 SDK 27.1이다.
- App Store 호환 기기 목록만 있는 55개는 itsub에서 4개가 ‘일반’, 51개가 미수록이다. 기기 목록은 SDK 대체 신호가 아니다.
- **미등록 KR 호환·여백 395개**: 제품 페이지를 수집했다(`docs/data/itsub-catalog-new-pages-2026-11-23.json`, 390개 성공·
  404 5개, 버전 기록 8,352건). 공식 Duo 문구 분류는 지원 확인 96 · 부분 대응 12 · 호환 목록만 5 · 버그 수정만 4 · 무관 1,
  언급 없음 272다. 목록은 `.data/itsub-review-2026-11-23/catalog-new-candidates.json`이며 위 표의 미등록 6개를 포함한다.
  규칙 분류 뒤 직접 대조해 4개를 고쳤다(오목 듀오·AdGuard → 부분 대응, 윌유 → 부분 대응, UMC → 무관).

## 신규 등록 준비 (미반영)

카탈로그 후보 중 지원 확인 96 · 부분 대응 12개와 젠레스 존 제로(지원 예정)의 KR Lookup을 수집했다
(`docs/data/itsub-register-lookup-2026-11-23.json`, 109개 성공, 제품 페이지와 현재 버전 충돌 0).
한영 요약은 원문 인용을 읽고 직접 작성했다. 검토 manifest: `.data/itsub-review-2026-11-23/register-reviewed.json`.

- 공개 대상 90개: 지원 확인 80 · 부분 대응 10.
- 비공개 초안 18개: 공식 장르가 현재 분류에 없다(Developer Tools 15 · Medical 2 · Magazines & Newspapers 1).
  PRD에 따라 다른 분류로 바꾸지 않는다. GitHub·TestFlight·Termius·Moshi 등이 여기에 속한다.

반영하면 공개 앱은 1,747 → 1,845개(신규 90 + 젠레스 존 제로 1 + 지원 정보 없음 7), 지원 확인 307 → 387,
부분 대응 0 → 15(기존 5 + 신규 10), 지원 예정 0 → 1, 지원 정보 없음 1,440 → 1,442가 된다.
기준값은 같은 날 다른 작업에서 보관 해제한 2개(Holy Rosary Audio Deluxe·Oxford Deluxe, 지원 정보 없음)를 반영한
운영 첫 화면 수치다. 두 앱과 보관 14개는 이번 반영 목록과 겹치지 않는다.

## 하지 않은 일

운영 DB 쓰기·배포, SDK·바이너리 분석, itsub 데이터 복제. 운영 DB 직접 조회는 권한 정책상 수행하지 않았고
공개 상세 HTML로 대체했다.
