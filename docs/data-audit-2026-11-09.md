# 앱 데이터 재검토 — 2026-11-09

후속 사용자 요청으로 지원 29개와 기존 앱 버전 381개를 운영에 반영했다. 현재 공개 앱 1,305개,
공식 지원 245개다. 아래 표는 반영 전 조사 시점의 집계다. [운영 반영 및 검증](data-update-2026-11-09.md)

한국 시간 08:36~08:47에 운영 DB의 등록 앱 전체와 한국 App Store의 미등록 후보를 읽기 전용으로 검토했다. 한국 스토어 App Store ID로 앱을 식별했다. 공식 지원을 추가로 확인한 앱은 **29개**다. 등록 앱 12개와 미등록 앱 17개다.

| 확인 항목 | 결과 |
| --- | ---: |
| 운영 등록 앱 / 공개 앱 | 1,298 / 1,288 |
| 공개 공식 지원 / 예정 / 근거 미확인 | 216 / 1 / 1,071 |
| 비공개 초안 / 보관 | 5 / 5 |
| 등록 앱 한국 API 정상 / notFound | 1,293 / 5 |
| 등록 앱 제품 페이지 정상 / 404 | 1,293 / 5 |
| 등록 앱 제품 페이지에 포함된 버전 기록 | 24,573 |
| 기존 지원 근거 재확인 | 216/216 |
| 공개 DB와 다른 현재 버전 | 381 |
| 11월 4일 원본과 버전이 다른 공개 앱 | 328 |
| 공개 DB와 다른 릴리스 노트 / 아이콘 출처 URL | 214 / 493 |
| 공식 차트 / 차트 범위 고유 앱 | 46 / 892 |
| 차트 미등록 앱 / 별도 대조 미등록 앱 | 165 / 10 |
| 미등록 후보 API 및 제품 페이지 정상 | 각각 175/175 |
| 미등록 후보 제품 페이지에 포함된 버전 기록 | 2,548 |
| DB 정합성 검사 | 25개 규칙, 오류 0 |

차트 범위는 전체 무료·유료 각 100위와 기존 22개 카테고리 무료·유료 각 20위다.
미등록 165개 중 11개는 11월 4일의 미등록 차트 후보와 겹친다. 차트 밖에서는 Microsoft 앱과 Halide 등 10개를 따로 대조했다.
미등록 175개 중 2개는 현재 카테고리 매핑이 비어 있다.

버전 차이 381개는 오늘 한국 API와 제품 페이지의 버전이 모두 일치한다.
11월 4일과 비교한 328개에는 당시 미등록 조사 후 공개한 앱 중 버전이 바뀐 4개도 들어 있다.
릴리스 노트와 아이콘 URL 차이는 버전 차이와 겹칠 수 있다. 아이콘 검토는 출처 URL 비교 범위다.

## 등록 앱에서 확인한 추가 지원 12개

기존 근거 미확인 11개와 지원 예정 1개다. Outlook의 공식 iOS 릴리스 노트에서
5.2641.0의 지원을 확인했고 같은 빌드를 한국 App Store 버전 기록과 대조했다.
Paprika 4는 저장된 Paprika 3과 App Store ID가 같아 등록 앱으로 집계했다.

| 앱 | 현재 버전 | 지원 근거 버전 | 확인한 내용 | 출처 |
| --- | --- | --- | --- | --- |
| 당근 | 26.45.1 | 26.45.0 | 듀오의 넓은 화면에 대응 | [한국 App Store](https://apps.apple.com/kr/app/id1018769995) |
| Paprika Recipe Manager 4 | 4.0.20 | 4.0.17 | 동일 앱 ID로 배포된 Paprika 4에서 지원 | [한국 App Store](https://apps.apple.com/kr/app/id1303222868) |
| 하루하루: 핵심은 자기관리 | 4.6.4 | 4.6.4 | 펼친 화면에서 일정 목록과 원형 시간표를 나란히 표시 | [한국 App Store](https://apps.apple.com/kr/app/id1452035712) |
| iFacialMocap | 1.5.5 | 1.5.4 | 듀오와 화면 크기·방향 변화에 맞춘 레이아웃 개선 | [한국 App Store](https://apps.apple.com/kr/app/id1489470545) |
| WidgetClub:위젯·배경화면·아이콘 테마 꾸미기 | 4.17.41 | 4.17.41 | 개발사가 지원을 명시했고 실기기 테스트는 미수행했다고 함께 안내 | [한국 App Store](https://apps.apple.com/kr/app/id1580284904) |
| SketchClub: Draw & Paint | 3.1.4 | 3.1.4 | 개발사가 초기 듀오 지원을 명시 | [한국 App Store](https://apps.apple.com/kr/app/id404414176) |
| Clean YTube for Safari | 1.0.17 | 1.0.17 | 듀오용 사용자 인터페이스 개선 | [한국 App Store](https://apps.apple.com/kr/app/id6754407661) |
| M8 Music Tracker | 1.2.3 | 1.2.3 | iOS 업데이트에서 듀오 지원을 명시 | [한국 App Store](https://apps.apple.com/kr/app/id6806721202) |
| Hourline: 위젯과 배경화면 | 1.1.2 | 1.1.2 | Pro에서 접는 각도에 따라 3D 시점 변경 | [한국 App Store](https://apps.apple.com/kr/app/id6816602142) |
| Duo Fold Counter | 1.2.1 | 미공개 | 듀오 접기·펼치기 횟수 기록. 설명에 나온 단축어 경로는 iOS 27.2 이상 조건 | [한국 App Store](https://apps.apple.com/kr/app/id6827677447) |
| Canva(캔바): 디자인, 사진편집, 동영상 편집 | 4.234.0 | 4.234.0 | 펼쳐서 디자인하고 접어서 휴대폰 크기로 미리보기 | [한국 App Store](https://apps.apple.com/kr/app/id897446215) |
| Microsoft Outlook | 5.2643.0 | 5.2641.0 | 나란히 보기와 화면 방향·창 크기 변화에 맞춘 레이아웃 | [Microsoft 릴리스 노트](https://learn.microsoft.com/en-us/officeupdates/release-notes-outlook-mobile) |

## 미등록 앱에서 확인한 공식 지원 17개

공식 차트에서 찾은 앱 12개와 차트 밖에서 따로 대조한 5개다. 지원 근거 버전은
직접 읽은 릴리스 노트의 버전이다. 설명에서만 지원을 확인한 앱은 미공개로 표시했다.

| 앱 | 현재 버전 | 지원 근거 버전 | 확인한 내용 | 출처 |
| --- | --- | --- | --- | --- |
| Currency – 환율 변환기・계산기 | 2.12 | 2.11 | 듀오 화면 레이아웃 지원 | [한국 App Store](https://apps.apple.com/kr/app/id1109685198) |
| Nautilus: 웹, Word, 주석 | 27.0.5 | 27.0.0 | 듀오 지원 및 새 인터페이스 | [한국 App Store](https://apps.apple.com/kr/app/id1422480068) |
| Notes Writer: PDF·AI·주석 | 27.1.8 | 27.1.2 | 공개 버전 기록에서 듀오 대응 완료를 명시 | [한국 App Store](https://apps.apple.com/kr/app/id1423643723) |
| WPS Office: AI 문서, PDF, 엑셀 | 26.10.2 | 26.10.1 | 접고 펼칠 때 문서·스프레드시트 등의 배치를 조정 | [한국 App Store](https://apps.apple.com/kr/app/id1491101673) |
| 투두메이트: 할 일 목록, 루틴 플래너 | 5.17.0 | 5.15.16 | 듀오 화면에 맞춘 캘린더와 앱 레이아웃 개선 | [한국 App Store](https://apps.apple.com/kr/app/id1505220130) |
| Cloud Baby Monitor | 26.2 | 26.2 | 듀오 최적화를 명시 | [한국 App Store](https://apps.apple.com/kr/app/id432791399) |
| Retroman: 패미컴 게임보이 & GBA 에뮬레이터 | 5.4.2 | 5.4.2 | 듀오 지원 추가를 명시 | [한국 App Store](https://apps.apple.com/kr/app/id6502994389) |
| MSG View | 3.7 | 3.7 | 공개 버전에서 듀오용 업데이트를 명시 | [한국 App Store](https://apps.apple.com/kr/app/id6741166769) |
| Speed-Tracker | 3.1 | 3.1 | 펼친 화면에서 콘텐츠를 나란히 표시 | [한국 App Store](https://apps.apple.com/kr/app/id6742644783) |
| AiModelTracker | 1.43 | 1.42 | 듀오의 넓은 화면에 맞춘 재설계 | [한국 App Store](https://apps.apple.com/kr/app/id6794120528) |
| Auday - All-Day Watch Recorder | 1.0.8 | 1.0.6 | 접힌·펼친 상태에 맞춘 레이아웃 | [한국 App Store](https://apps.apple.com/kr/app/id6814210373) |
| Duo Aquarium | 1.1 | 1.1 | 반쯤 접었을 때 데스크 보기와 힌지 위아래에 나뉜 컨트롤 | [한국 App Store](https://apps.apple.com/kr/app/id6819150080) |
| Satisfy: ASMR Fidget Toys | 1.1 | 미공개 | 힌지를 여닫는 동작에 소리·햅틱으로 반응 | [한국 App Store](https://apps.apple.com/kr/app/id6821710782) |
| Ta-Duo: 서프라이즈 선물 상자 | 1.1 | 미공개 | 접었다 펼치는 동작으로 선물 상자를 열도록 설계 | [한국 App Store](https://apps.apple.com/kr/app/id6827736649) |
| Brim: 화면 끝까지 브라우징 | 26.45.1 | 미공개 | 듀오 바깥 화면에서 Safari 표시 영역을 확장 | [한국 App Store](https://apps.apple.com/kr/app/id6830004679) |
| Halide Mark III - Pro Camera | 3.3.3 | 3.3.0 | 닫힘·펼침·반쯤 펼침 상태별 촬영 UI | [한국 App Store](https://apps.apple.com/kr/app/id885697368) |
| Wavve (웨이브) | 7.3.80 | 7.3.71 | 듀오 화면에 맞게 최적화 | [한국 App Store](https://apps.apple.com/kr/app/id987782077) |

## 보류와 기존 근거 재확인

네이버지도 6.12.1·6.12.2의 듀오 사용성 개선은 확인했다. 지원 기능이나 배치의 범위는
공식 원문에서 추가 확인이 필요하다. Pocket Casts의 준비 문구, 특정 오류 수정,
일반 폴더블 대응, CineTemp의 기기명이 생략된 문구도 각각 보류했다.
Microsoft Word·Excel·PowerPoint·OneNote와 Etsy는 조사한 한국 제품 자료에서 구체적인
현재 지원 근거를 확보하지 못했다. Word의 과거 Apple 발표에는 예정 문구가 있다.
[Apple 발표](https://www.apple.com/kr/newsroom/2026/10/developers-bring-incredible-new-app-experiences-to-iphone-duo/)

기존 공식 지원 216개 중 213개의 저장된 인용을 오늘 공식 원문에서 다시 찾았다.
Tiny Computers, Foldling, Pocket Mac Lab은 설명이 바뀌어 현재 제품 설명의
접힘·바깥 화면 등 직접 대응 문구로 재확인했다. 대체 인용과 관측 시각을 따로 저장했다.
Outlook의 기존 예정 발표도 재관측했고, 위의 Microsoft 릴리스 노트가 지원 상태 정정 근거다.

보관 앱 5개는 일괄·개별 한국 API에서 모두 notFound였고 제품 페이지는 404였다.
보관 상태 외의 등록 앱 1,293개는 두 경로 모두 성공했다.

## 운영 및 검증 기록

공개 집계는 한국어·영어 실제 운영 응답과 대조했다. 초안·보관 10개는 익명 DB에서
공개 행·아이콘·이력 조회가 각각 0건이었다. 운영 상세 20개와 아이콘 10개의 접근 차단도 확인했다.
조사 전후 운영 콘텐츠 16개 테이블 해시를 대조했다. 지원 근거 29개와 버전 차이 381개는 반영 후보로 기록했다.

정합성 검사 경고는 의료 분류 미매핑 초안 5개와 최신 노트 밖의 과거·설명 근거 66개였다.
lint는 기존 경고 3개, typecheck와 단위 100개, Chromium E2E 37개는 통과했다.
기본 Turbopack 빌드는 로컬 프로세스·포트 권한 오류로 실패했고 Webpack 빌드는 통과했다.
[검증 이력](verification.md)

앱별 비교표, 선정한 근거, 기존 근거 대체 인용, 차트 및 실제 검사 기록은
`.data/fullscan-2026-11-09/`에 있다. 공식 수집 원본은
`docs/data/fullscan-{lookup,pages,new-lookup,new-pages,extra-lookup,extra-pages}-2026-11-09.json`이다.
관측 범위는 한국 제품 설명, API 노트, 제품 페이지에 포함된 버전 기록과 선별한 Apple·개발사 공식 문서다.
