# 운영 데이터 최신화 — 2026-11-27

사용자 요청(“데이터 최신화 ㄱ”)에 따라 한국 App Store의 공식 차트·앱 정보·지원 근거를 다시 조회해 운영 DB에 반영했다.

- 신규 앱 203개를 등록하고 모두 공개
- 기존 공개 앱 465개의 현재 버전 갱신
- 정상 한국 Lookup에서 부재가 확인된 2개를 기존 정책에 따라 보관
- 기존 앱 지원 정정 7개(지원 확인 5 · 부분 대응 2), 신규 앱 지원 23개(지원 확인 19 · 부분 대응 4)
- 같은 앱 ID의 표시 이름 갱신 14개

| 항목 | 반영 전 | 반영 후 |
| --- | ---: | ---: |
| 등록 앱 | 1,885 | 2,088 |
| 공개 앱 | 1,871 | 2,072 |
| 지원 확인 | 403 | 427 |
| 부분 대응 | 17 | 23 |
| 지원 예정 | 1 | 1 |
| 지원 정보 없음(공개 근거 미확인) | 1,450 | 1,621 |
| 비공개 초안 / 보관 | 0 / 14 | 0 / 16 |

반영 전 운영 콘텐츠 16개 테이블 해시는 11-23 마지막 반영(의학 초안 공개) 뒤 값과 같았다.

11-24에도 같은 요청으로 수집·검토를 마쳤으나, 운영 쓰기 단계가 권한 확인에서 멈춰 반영하지 않았다.
11-27 재요청 때 3일 지난 관측을 쓰지 않고 전부 다시 수집했다. 11-24의 판정은 오늘 원문에서 같은
문구가 다시 확인된 앱에만 이어서 적용했다. 11-24 자료는 `.data/refresh-2026-11-24/`에 반영되지 않은
기록으로만 남는다.

## 수집 범위와 판정

기존 등록 앱 1,885개와 신규 후보 203개를 조사했다.

- 기존 한국 API: 1,869개 정상, 16개 notFound(기존 보관 14 + 새 부재 2)
- 기존 제품 페이지: 1,869개 정상, 16개 404 (API 실패와 같은 집합)
- 신규 후보: API·제품 페이지 모두 203개 정상
- 제품 페이지의 버전 기록: 기존 33,865건, 신규 2,786건, 합계 36,651건

전체 무료·유료와 25개 카테고리 무료·유료의 공식 차트 52개를 수집했다. 11-23에 추가한 개발자 도구·의학·
잡지 및 신문 3개 분류의 차트가 처음 포함됐다. 전체 각 100위와 카테고리별 각 20위 범위에서 고유 앱
1,001개를 확인했고 그중 미등록 앱은 203개다. 전체 무료 차트는 기본 요청이 두 번 시간 초과돼 같은 날
HTTP/1.1로 다시 받았다(100개, 원본 보존). 기존 근거의 App Store 외 공식 출처 5개는 모두 HTTP 200이었다.
이전에 보관한 14개는 오늘도 모두 notFound였다.

### 기존 지원 근거 재확인

기존 지원 확인·부분 대응·지원 예정 421개 중 411개는 저장된 인용을 현재 공식 원문에서 다시 확인했다.
9개는 현재 공식 문구로 재확인했다.

- 11-23과 같은 대체 문구로 확인한 8개: Papelle, Tiny Computers, Foldling, Pocket Mac Lab, Widezilla, Wowie, Sidefill, DuoFridge
- 새로 대체 확인한 1개: [HTML 뷰어 & 에디터](https://apps.apple.com/kr/app/id6759328000)
  - 설명에서 기존 인용 “iPhone Duo 지원, 접거나 펼쳐도 OK”가 빠졌다.
  - 현재 설명과 2.1.0 노트의 “iPhone Duo 지원”으로 확인했다.

원래 공개 근거는 교체하거나 삭제하지 않았다. [Fold Counter](https://apps.apple.com/kr/app/id6827677447)는
이번에도 현재 설명에서 일반적인 접이식 iPhone·힌지 감지 문구만 확인했다. 공식 미지원 선언도 찾지 못해
기존 지원 판정·근거·지원 버전·검토일·이력을 보존한다.

### 지원 후보 판정

판정은 [부분 대응 정책](../specs/012-partial-support/spec.md)을 따른다. ‘지원 확인’은 Duo 지원·최적화나
Duo 전용 화면·기능을 명시한 경우다. ‘부분 대응’은 Duo를 직접 언급한 개선이지만 범위가 불명확한 경우다.

기존 미확인 후보 37개 중 7개를 정정하고 30개는 보류했다. 새 보류 문구는 다음과 같다.

- 할일차곡: 일반 폴더블 잠금화면 대응
- Lexu.GG: ‘솔로/듀오’ 랭크와 ‘듀오 파트너’는 게임 용어
- 듀오링고: 마스코트 ‘듀오’
- 갓피플성경: ‘그룹 펼침/접힘’ 버튼 이름
- 월드클래스: 게임 ‘듀오 매칭’

신규 앱에서 근거로 쓰지 않은 문구는 다음과 같다.

- Mai Drum Studio: 갤럭시 폴드·태블릿 배치
- The Button: 마술 소품 ‘folded card’
- Herdr: iPhone Duo 버그 수정만 있음
- 소소노트: ‘캘린더 펼침’ 조작
- 일랜시아 모바일: 개발사명 Game Duo
- ACAAT CHRONOMASTER: 마술 소품 lumen duo

## 지원 반영 30개

현재 버전과 지원 근거 버전은 별개다. 근거 버전은 같은 문구가 실린 관측 범위의 가장 이른 버전이며,
최초 지원 버전이라는 뜻은 아니다. 설명으로만 확인한 앱은 지원 버전을 미공개로 유지한다. 검토는 AI 보조
공식 원문 확인이며 실기기 테스트·배지 관측·특정 사람의 검토를 의미하지 않는다.

| 구분 | 앱 | 상태 | 근거 버전 | 공식 문구 |
| --- | --- | --- | --- | --- |
| 기존 | [예스24 eBook & 크레마클럽](https://apps.apple.com/kr/app/id1009076561) | 지원 확인 | 3.4.59 | 아이폰 듀오 최적화 및 일부 UI 변경 |
| 기존 | [Sketchbook®](https://apps.apple.com/kr/app/id883738213) | 지원 확인 | 6.3.1 | iPhone Duo에 최적화 |
| 기존 | [메몽 - 메모장, 투두리스트, 일기](https://apps.apple.com/kr/app/id1494637370) | 지원 확인 | 2.4.16 | 아이폰 듀오를 접거나 펼치면 메모 목록과 편집 버튼이 화면 크기에 맞춰 배치됩니다. |
| 기존 | [로드센트리 RoadSentry](https://apps.apple.com/kr/app/id6809515966) | 지원 확인 | 1.0.19 | 아이폰 듀오를 펼친 화면과 접은 화면에 맞췄습니다. |
| 기존 | [Chord Lab](https://apps.apple.com/kr/app/id6832087760) | 지원 확인 | 0.26.2 | Layouts adaptados ao iPhone Duo, aberto ou fechado, em retrato e paisagem. |
| 기존 | [TVING](https://apps.apple.com/kr/app/id400101401) | 부분 대응 | 26.48.01 | iPhone Duo 사용성 개선 |
| 기존 | [TurboScan](https://apps.apple.com/kr/app/id342548956) | 부분 대응 | 3.4.3 | Compatibility with iPhone Duo |
| 신규 | [점적속도계산](https://apps.apple.com/kr/app/id358073020) | 지원 확인 | 4.3.0 | iPhone Duo를 지원합니다. |
| 신규 | [Grays Anatomy Premium Edition](https://apps.apple.com/kr/app/id468314731) | 지원 확인 | 2.0 | Optimised layouts for every screen size, including the new iPhone Duo |
| 신규 | [Code Recipes Pro](https://apps.apple.com/kr/app/id1061486140) | 지원 확인 | 4.13 | 펼친 iPhone Duo를 세로로 두어도 목록과 코드가 나란히 보입니다. |
| 신규 | [Feelca S](https://apps.apple.com/kr/app/id6746457078) | 지원 확인 | 2.0.4 | iPhone Duo 지원 추가 |
| 신규 | [Slow Shutter Cam](https://apps.apple.com/kr/app/id357404131) | 지원 확인 | 6.4 | Add iPhone Duo support. |
| 신규 | [DuoPod: Pocket Music Player](https://apps.apple.com/kr/app/id6834979304) | 지원 확인 | 미공개 | DuoPod turns the cover screen of your iPhone Duo into a pocket music player. |
| 신규 | [RetroDeck: Retro Music Player](https://apps.apple.com/kr/app/id6777827556) | 지원 확인 | 1.1.0 | Made for iPhone Duo. |
| 신규 | [Planit Pro: 사진 플레너](https://apps.apple.com/kr/app/id898876435) | 지원 확인 | 11.0.0 | iPhone Duo 지원: 회전 및 접힘 상태에 맞춘 레이아웃 |
| 신규 | [Compact Contacts Manager](https://apps.apple.com/kr/app/id6795653671) | 지원 확인 | 2.0 | iPhone Duo: unfolded, lists, contacts and details side by side. |
| 신규 | [YouPlay: 광고 차단 비디오 브라우저](https://apps.apple.com/kr/app/id6751497996) | 지원 확인 | 1.3.8 | Added iPhone Duo support. |
| 신규 | [Bauhaus Clock - 아날로그 시계](https://apps.apple.com/kr/app/id6755106534) | 지원 확인 | 1.2 | Bauhaus Clock 1.2가 출시되었습니다. iPhone Duo에 최적화되었으며, 새로운 디테일로 가득합니다. |
| 신규 | [Glucose Relay](https://apps.apple.com/kr/app/id6830945020) | 지원 확인 | 1.4 | iPhone Duo. Every screen is laid out for both displays, closed and open. |
| 신규 | [iSpreadsheet™](https://apps.apple.com/kr/app/id932687167) | 지원 확인 | 27.1 | iPhone Duo Support |
| 신규 | [Anatomy Recall: 3D 인체 해부학](https://apps.apple.com/kr/app/id6804860511) | 지원 확인 | 1.0.7 | Made for iPhone Duo. Unfold it and the whole body opens up across the big screen. |
| 신규 | [KL烘焙曲线](https://apps.apple.com/kr/app/id6799672617) | 지원 확인 | 1.8.3 | 适配iPhone Duo |
| 신규 | [Scriptable](https://apps.apple.com/kr/app/id1405459188) | 지원 확인 | 1.8 | Scriptable now supports iPhone Duo, with layouts tailored to its screen. |
| 신규 | [Rex by Superlogical](https://apps.apple.com/kr/app/id6813649254) | 지원 확인 | 0.1.1 | On iPad and an opened Duo, swipe with two fingers to move the terminal so the cursor stays above the keyboard |
| 신규 | [Resolutioner](https://apps.apple.com/kr/app/id1563852783) | 지원 확인 | 2.2 | This update brings full support for iPhone Duo. The app now adapts to both screens, all poses, and all orientations. |
| 신규 | [Reference Board: Mood Board](https://apps.apple.com/kr/app/id6759159660) | 지원 확인 | 1.6 | Reference Board now supports iPhone Duo, with layouts that adapt as you open and close your device. |
| 신규 | [실물 크기 자](https://apps.apple.com/kr/app/id6503698542) | 부분 대응 | 1.19.2 | iPhone Duo가 부분적으로 지원됩니다. |
| 신규 | [Monash FODMAP Diet](https://apps.apple.com/kr/app/id586149216) | 부분 대응 | 5.0.3 | Better landscape support for larger devices such as iPad and iPhone Duo |
| 신규 | [Wipr 2](https://apps.apple.com/kr/app/id1662217862) | 부분 대응 | 2.46 | Wipr is now awesome on iPhone Duo |
| 신규 | [Drugs & Medications](https://apps.apple.com/kr/app/id337974028) | 부분 대응 | 미공개 | it works on iPhone (including iPhone Duo) and iPad |

부분 대응 6개의 공개 요약은 어떤 화면·기능이 바뀌었는지 원문이 밝히지 않았다는 점을 함께 적었다.

## 메타데이터·이름·공개 범위

기존 공개 앱 1,869개의 정상 API 수집 결과를 기록했다. 그중 현재 버전 465개를 갱신했다. 신규 203개는
이미 오늘 관측값으로 등록돼 메타데이터 단계에서 건너뛰었다. 같은 배치 재실행은 변경 0개였다. 일반
메타데이터 갱신은 지원 상태·지원 버전·요약·검토일·이력을 보존한다. 정상 API·페이지 사이의 현재 버전
충돌은 없었다.

동일 App Store ID의 한국 API·제품 페이지 제목이 일치한 14개의 이름을 갱신했다. 이전 이름은 별칭에
남겼고, 익명 역할에서 이전 이름·새 이름의 한영 검색 56개를 확인했다.

- 크래프트 (Craft): 노트, 문서, AI → Craft: 노트, 문서, 할 일
- Freecash - 돈버는앱 → Freecash - 리워드 받기
- 카카오맵 - 대한민국 No.1 지도앱 → 카카오맵 - 지도 / 내비게이션 / 길찾기 / 친구위치
- CHMate+: EPUB·CHM 전자책 리더 → 동리독서 · 東籬讀書 (구 CHMate+) — 공식 제목에 이전 이름이 명시된 브랜드 변경
- 월드클래스 → 월드클래스 - 대표 PC방 필수 앱 & 게이머 플랫폼
- 일본어 한자 위젯 - Kanji-it 잠금화면 학습 → Kanji-it 일본어 한자 위젯 학습
- Lexu.GG: Champion Pick & Ban → Lexu.GG: 롤 챔피언 픽밴
- HTML 파일 관리 및 편집기 → HTML 뷰어 & 에디터
- 사탐기출 단원별 학습 | 10개년 → 통사기출 단원별 학습 | 10개년
- INZEUM 인지엄 → INZEUM 인지엄: 명상, 수면
- Hourline: 위젯과 배경화면 → Hourline: 세계 시계 & 위젯
- METOSAN - 메토상 → 메트로놈 메토상 - 기특하고 귀여운 박자 친구
- AnyFont → AnyFont install fonts & finder
- 작명어플 : 넴유베 (Name Your Baby) → 넴유베 작명어플 -이름 짓기·개명·이름풀이·이름추천

아래 2개는 정상 한국 Lookup notFound와 제품 페이지 404를 함께 확인했다. 반영 직전 Lookup을 다시 조회한 뒤
보관했다. 두 앱 모두 ‘지원 정보 없음’ 상태였다. 보관은 공식 미지원 판정이나 영구 판매 종료 주장이 아니며,
기존 앱·아이콘·이력은 비공개로 보존한다.

- [Relax Melodies P: Sleep Sounds](https://apps.apple.com/kr/app/id331529422)
- [Fine° Rise](https://apps.apple.com/kr/app/id883994808)

신규 203개와 기존 지원 정정 7개의 아이콘을 검증·저장했다. 기존 원본 검증·비공개 Storage 경로와
[자산 기록](assets.md)의 정책을 따랐다.

차트는 신규 앱 선정과 발견 출처 기록에만 사용했다. 공개 인기순은 동기화하지 않았다. 스키마 변경·배포·
상시 수집 활성화는 수행하지 않았다.

## 반영과 검증

각 단계는 운영 콘텐츠 백업, 명시적 production/project ref, serializable 트랜잭션과 advisory lock,
직전 16개 콘텐츠 테이블 해시 대조로 보호한다. 보관·신규 등록·메타데이터·지원 정정·이름 갱신을 각각
dry-run 후 반영했고, 모든 단계의 동일 입력 재실행에서 추가 변경 0개와 해시 불변을 확인했다.

11-23 반영 스크립트는 지원 확인만 다뤘다. 이번에 신규 등록·지원 정정·독립 검증·운영 HTTP 검사가
`partial` 상태와 집계를 다루도록 고쳤다(`.data/refresh-2026-11-27/`).

한국 시간 13:49 독립 DB 검증 결과는 다음과 같다.

- 등록 2,088개, 공개 2,072개
- 지원 확인 427 · 부분 대응 23 · 지원 예정 1 · 지원 정보 없음 1,621
- 초안 0개, 보관 16개
- 공개 2,072개 전부의 API 메타데이터·제품 페이지 신원 일치
- 페이지 버전 대조 2,003개, 정상 페이지의 버전 기록 부재 69개(기존 53·신규 16개)
- 최종 16개 콘텐츠 테이블 해시와 신규 203개의 차트 발견 출처 확인
- 이전 근거와 일반 갱신의 검토일·이력 보존
- 비공개 16개의 익명 행·아이콘·이력 조회 각각 0개
- 정합성 규칙 오류 0개
- 경고 2종
  - 최신 노트 밖 인용 283개
  - 영어 요약 `needs-review` 5개: 11-23 부분 대응 기존 5개(네이버지도·리디·CNN·그해오늘·페이북). 반영 전부터 있던 상태이며 이번에 바꾸지 않았다.

13:50 운영 HTTP 검사 결과는 다음과 같다.

- HTML 128개 확인: 한영 집계 2개, 지원 상세 60개, 버전 표본 6개, 이름 검색 56개, 보관 안내 4개
- 아이콘 210개 SHA-256이 DB와 일치
- 새로 보관한 2개의 아이콘은 404, 한영 상세는 not-found·noindex 화면

최종 독립 DB·운영 HTTP 검사는 각각 첫 실행에서 통과했다.

## 제품 검사

제품 코드는 바꾸지 않았고, 제품 검사는 오늘 새로 실행했다.

- `npm run lint`: 통과. 경고 6개(모두 `.data/` 스크립트), 오류 0개.
- `npm run typecheck`: 통과.
- `npm test`: 23개 파일, 139개 통과.
- `npm run test:e2e`: Chromium 59개 통과(첫 실행).
- `npm run build`: Next.js 16.4.6 기본 Turbopack 빌드 통과(첫 실행). 기존 코드의 동적 파일 시스템 추적 경고 4개가 출력됐다(`src/lib/icons/storage.ts` 등).

종료 코드와 로그는 `.data/refresh-2026-11-27/checks/`에 있다.

## 증빙

공식 원본은 `docs/data/refresh-{lookup,pages,new-lookup,new-pages}-2026-11-27.json`과 보조 공식 출처
관측에 있다. 비공개 원본은 기존 정책에 따라 Git에서 제외한다.

`.data/refresh-2026-11-27/`에는 차트 원문(복구한 전체 무료 차트 포함), 기준 백업, 검토 manifest·결정·예외,
단계별 dry-run/apply/repeat 결과, 검증 실행 결과를 보존한다. 신규 등록 직전 백업은 `.data/release/`에 있다.
최종 운영 검증과 제품 검사 결과는 [검증 기록](verification.md)에 연결한다.
