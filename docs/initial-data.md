# 실제 초기 앱 데이터

## 2026-10-29 작업 범위

사용자 요청에 따라 비어 있는 로컬 앱 DB에 실제 앱 후보를 등록한다. 기능 구현 완료와
콘텐츠 준비 완료를 구분한다. Apple 공식 컬렉션에서 발견한 후보의 KR Lookup 정보를
기존 가져오기 함수로 저장하고, 발견 출처·실제 조회 시각·성공/실패를 기록한다.

- 후보 출처: Apple 한국 듀오 소개 컬렉션, 미국 Great Apps 컬렉션, 미국 Popular Apps 컬렉션.
- 미국 컬렉션은 발견 경로이며 한국 배포/지원 증거로 대체하지 않는다.
- 한국 Lookup 성공 항목만 초안으로 등록한다. 지원 판정·사람의 검토일을 생성하지 않는다.
- 기존 `authenticated` 역할·관리자 확인·RLS·`app_private.import_app`을 사용한다.
- 공개 전에는 앱별 공식 근거와 배포 상태를 검토하고 명시적으로 승인해야 한다.
- 기존 앱/근거/공개 스냅샷을 덮어쓰거나, 외부 프로젝트/배포를 생성하지 않는다.

검증 기준: 성공 수와 DB 앱/가져오기 결과 대조, 동일 메타데이터의 재입력 중복 방지,
공개/검토일 자동 생성 없음, 관리자 목록에서 실제 데이터 접근 확인.

실행 결과는 작업 완료 후 아래에 기록한다.

## 실제 실행 결과

수집: 2026-10-29T06:30:32.614Z ~ 2026-10-29T06:37:09.071Z (UTC). 검증: 2026-10-29T06:38:12.741Z (UTC).

| 항목 | 결과 |
| --- | --- |
| 공식 컬렉션 후보 | 133개 |
| KR Lookup 성공·DB 초안 저장 | 128개 |
| KR Lookup 결과 없음 | 5개 — 다른 국가 데이터로 대체하지 않음 |
| 기존 9개 카테고리 해당 | 63개 |
| 기존 분류 범위 밖 | 65개 — 임의 분류하지 않고 초안 유지 |
| 앱별 직접 지원 근거·ko/en 요약 준비 | 22개 — 아직 초안 |
| 공개 앱·사람의 검토일·공개 감사 이벤트 | 각각 0개 |
| 동일 자료 128개 재입력 검사 | 128개 모두 duplicate, 검사 트랜잭션 rollback |

공식 컬렉션 링크만으로 지원 판정을 확정하지 않았다. 22개는 해당 앱의 KR Lookup 업데이트 설명에서 직접적인 지원·최적화 문구를 확인했다. 22개 외 106개는 추가 조사 또는 분류 범위 검토가 필요하다. 100개 공개 목표를 달성한 상태가 아니다.

## 공개 승인 대상 22개

**현재 상태: AI 보조 출처 검토와 초안 저장 완료, 사람의 공개 승인 대기.**
지원 버전은 이번에 지원 문구와 함께 관찰한 버전이다. 최초 지원 버전이라고 주장하지 않는다. 발표일은 명시적으로 확인하지 않아 비워 두었다. 별도 기능 태그와 앱 아이콘은 추가하지 않았다.

| 앱 · 공식 KR 출처 | 확인 버전 | 한국어 공개 요약 | 근거 원문 발췌 |
| --- | --- | --- | --- |
| [VLLO 블로 - AI 영상 편집기](https://apps.apple.com/kr/app/id952050883) | 15.1.0 | iPhone Duo에 맞춘 영상 편집 UI를 제공합니다. | [iPhone Duo UI 최적화] iPhone Duo에서도 편리하게 사용할 수 있도록 UI를 최적화하였습니다. |
| [101cam - 필름 & 디지털 카메라](https://apps.apple.com/kr/app/id6781998623) | 1.2.6 | 듀오 프리뷰를 지원하고 기기 각도에 맞춰 화면을 최적화합니다. | [iPhone Duo 지원] 듀오 프리뷰를 지원하고, 어떤 각도에서도 화면이 최적화돼요. |
| [카카오페이지](https://apps.apple.com/kr/app/id616643813) | 7.34.2 | 한국 App Store 업데이트 내역에 iPhone Duo 대응을 명시했습니다. 세부 기능은 공개하지 않았습니다. | - iPhone Duo 대응 |
| [(Not Boring) Camera](https://apps.apple.com/kr/app/id6737783441) | 1.62 | 한국 App Store 업데이트 내역에 iPhone Duo 지원을 명시했습니다. 세부 기능은 공개하지 않았습니다. | !Camera가 iPhone Duo를 지원합니다. |
| [Timepage Schedule Day Planner](https://apps.apple.com/kr/app/id989178902) | 5.2.2 | 펼친 화면에 일정을 넓게 보여주며, 듀오용 세로 내비게이션과 자세에 맞는 인터페이스를 제공합니다. | 이제 iPhone Duo에서 Timepage를 만나 보세요.  접었을 때는 익숙하고 사랑하는 그 캘린더 그대로입니다. 펼치면 일정이 더 넓은 화면에 펼쳐집니다. |
| [Penbook: Paper Planner & Notes](https://apps.apple.com/kr/app/id1473064295) | 8.1.2 | 듀오의 기기 자세, 새로운 노트 용지 크기와 업데이트된 미니맵을 지원합니다. | iPhone Duo users, this one's for you: this update adds support for poses, new stationery sizes, and a minimap update. |
| [Things 3](https://apps.apple.com/kr/app/id904237743) | 3.25.1 | 기기 자세에 맞는 동적 레이아웃, 목록 사이드바와 측면 조작부를 제공합니다. | Things is ready for iPhone Duo! |
| [Classix](https://apps.apple.com/kr/app/id1071737169) | 5.35 | 듀오의 화면 크기와 방향에 맞춘 영화·TV 탐색 레이아웃을 제공합니다. | Classix is ready for iPhone Duo! |
| [Flighty – Live Flight Tracker](https://apps.apple.com/kr/app/id1358823008) | 4.11.3 | 듀오를 텐트처럼 세워 손으로 들지 않고 비행 진행 상황을 확인할 수 있습니다. | Flighty is ready for iPhone Duo.  During a flight, prop iPhone Duo up like a tent to follow your progress hands-free. |
| [Essayist: Academic Writing App](https://apps.apple.com/kr/app/id1537845384) | 2.2.0 | 펼치면 전체 페이지를, 반쯤 접으면 글과 검사 패널을 화면 양쪽에 보여줍니다. | Made for iPhone Duo: Write on the closed display or unfold for the full page. |
| [TypeDraw](https://apps.apple.com/kr/app/id6822194774) | 1.5 | 듀오를 펼칠 때의 전환을 개선하고 다양한 화면 크기와 방향에서 그리기를 다듬었습니다. | Plus a fresh app icon, improved drawing across screen sizes and orientations, smoother unfolding on iPhone Duo and plenty of bug fixes. |
| [Fantastical Calendar](https://apps.apple.com/kr/app/id718043190) | 4.2.4 | 한국 App Store 업데이트 내역에 iPhone Duo 지원 추가를 명시했습니다. 세부 기능은 공개하지 않았습니다. | - Added support for iPhone Duo |
| [Sofa: Downtime Organizer](https://apps.apple.com/kr/app/id1276554886) | 5.4.4 | 개발사가 iPhone Duo 전체 지원을 명시했습니다. 듀오 바깥 화면에서 팟캐스트 플레이어 이미지가 튀는 문제도 수정했습니다. | Sofa is ready with full support for iPhone Duo. |
| [Mockup - UI/UX Design](https://apps.apple.com/kr/app/id1527554407) | 4.6.1 | 안쪽·바깥쪽 화면과 반쯤 펼친 탁상 자세에 맞춘 디자인 작업 공간을 제공합니다. | Browse projects and sketch with layouts made for Duo’s outer and inner displays. |
| [Scratchbook: National Parks](https://apps.apple.com/kr/app/id6790084669) | 1.21 | iPhone Duo에 맞춘 레이아웃을 개선했습니다. | • Refinements throughout, including improved layouts for iPhone Duo. |
| [MD Vinyl - Music Player Widget](https://apps.apple.com/kr/app/id1606306441) | 3.8.5 | 기기를 접으면 앨범 배치가 바뀌며, 반쯤 펼치면 위쪽 앨범 커버와 아래쪽 레코드로 턴테이블 화면을 구성합니다. | MD Vinyl이 iPhone Duo에 찾아왔어요! |
| [Callsheet: Find Cast & Crew](https://apps.apple.com/kr/app/id1672356376) | 2026.8 | iPhone Duo를 지원하며 독립적으로 작동하는 여러 Callsheet 창을 열 수 있습니다. | - iPhone Duo를 지원합니다 - iPad 및 iPhone Duo에서 다중 인스턴스를 지원합니다. |
| [피그먼트 - 컬러링북](https://apps.apple.com/kr/app/id1062006344) | 3.16 | 개발사가 iPhone Duo 지원을 명시한 컬러링 앱입니다. 듀오 전용 세부 동작은 별도로 설명하지 않았습니다. | iPhone Duo 지원. 이제 Pigment가 iPhone Duo를 지원하여 Apple의 새로운 기기에서도 더욱 자유롭게 색칠하고 창작할 수 있습니다. |
| [Darkroom: Photo & Video Editor](https://apps.apple.com/kr/app/id953286746) | 7.6.1 | 최근 추가된 iPhone Duo 지원을 공식 업데이트 내역에 명시했습니다. 듀오 전용 세부 동작은 별도로 설명하지 않았습니다. | 최근 추가된 iPhone Duo 지원과 다양한 성능 및 안정성 개선을 만나보세요. |
| [Lake: 성인용 색칠 공부 및 만다라 책](https://apps.apple.com/kr/app/id1183717726) | 5.0.0 | 듀오를 펼치면 더 큰 캔버스에서 세밀하게 색칠할 수 있도록 최적화했습니다. | 이제 Lake가 iPhone Duo에 완벽하게 최적화되었습니다. 어디서든 컬러링을 즐기고, 디테일을 위해 더 넓은 공간이 필요할 때는 펼치기만 하면 더 큰 캔버스가 됩니다. |
| [Prêt à Makeup](https://apps.apple.com/kr/app/id1434594204) | 2.22.2 | 듀오 화면을 열 때 메이크업 조명이 화면을 따라 움직이도록 대응했습니다. | 아이폰 듀오를 만나보세요. 화면을 열면 메이크업 조명이 화면을 따라 움직여 원하는 곳에 빛이 그대로 머뭅니다. |
| [Journal & Note Taker - Zinnia](https://apps.apple.com/kr/app/id1485310935) | 1.49 | 공식 업데이트 내역에서 iPhone Duo 지원을 명시했습니다. 듀오 전용 세부 동작은 별도로 설명하지 않았습니다. | – Introducing iPhone Duo Support! Zinnia now supports iPhone Duo, giving you more flexibility to create on Apple's new device. |

영어 요약·앱 ID·초안 revision·수집 시각은 [검토 자료](data/initial-app-reviews.json)에 있다. 전체 후보 출처·성공·실패·재입력 검사 결과는 [수집 기록](data/initial-app-import.json)에 있다.

## 아이콘 저장 후속 작업 — 2026-10-29

실제 앱 128개의 아이콘을 Apple 이미지 서버에서 수집하여 로컬 파일로 저장했다. 총 4,105,819바이트,
JPEG 원본 128개이며 각각의 해시·원본 URL·수집 시각을 DB에 기록했다. 재실행은 해시 검증 후
128개 모두 건너뛰었고 실패는 없었다. 앱은 초안 128개, 공개 0개로 유지했다. 이 후속 작업은
아래 초기 데이터 작업 이후의 코드·스키마 변경이며, 최신 검증 결과는 `docs/verification.md`에 있다.

## 추가 조사 보류 이유

- Papelle의 듀오 버그 수정, Flipcorder의 접기/펼치기 중 종료 수정, Obscura의 듀오 스크린샷 추가만으로는 최적화 기능/지원 확정 범위를 판단하지 않았다.
- 한국 최신 릴리스 노트에 문구가 없는 앱을 미지원으로 간주하지 않았다. 과거 공식 근거나 개발사 문서를 추가로 조사해야 한다.
- Apple 한국 소개 컬렉션에 함께 포함된 게임, 소셜 네트워킹, 건강·피트니스 등은 기존 9개 분류로 임의 변환하지 않았다.

## 검증

- 실제 관리자 목록에서 가져온 앱을 확인하고 VLLO 편집 화면의 앱 ID·버전·두 언어 요약·원문 근거·초안 상태를 확인했다.
- 이번 실행: lint 통과, typecheck 통과, 단위 테스트 32개 통과, fixture E2E 15개 통과(11.4초). 이 실행 이후 공유 작업 폴더에 별도 운영 기능 코드가 추가됐다.
- build 1차: 실행 중 추가된 tests/unit/collection.test.ts가 아직 없던 src/lib/collection/web.mjs를 참조하여 실패했다.
- 해당 모듈이 생긴 뒤 build 재시도: src/app/[locale]/admin/operations-actions.ts:49의 string | null 인자와 null | undefined 타입 불일치로 실패했다. 이번 데이터 작업에서 해당 파일들을 수정하지 않았다. 전체 빌드 통과로 보고하지 않는다.
- 이번 작업의 저장소 변경은 실제 수집/검토 기록, 안내 문서와 004 후속 작업 체크리스트다. 앱 코드·DB 스키마·외부 배포 변경은 없다.
