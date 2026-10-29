# 한국 App Store API 검증

실행: 2026-10-29T05:29:22.856Z ~ 2026-10-29T05:29:50.178Z (UTC).

`node scripts/probe-app-store.mjs`로 같은 가져오기 모듈을 실행했다. DB 연결·초안 생성·공개 판정은 하지 않는다.
각 요청은 KR 고정, 최소 3초 간격, 8초 제한, 최대 2회 재시도를 적용한다. 수집 시각은 사람의 검토일이 아니다.

결과: 10/10개 응답 정규화 성공.

| ID | 실제 응답 이름 | 개발사 | 현재 버전 | 기본 장르 | 릴리스 노트 / 아이콘 URL | 결과 |
| --- | --- | --- | --- | --- | --- | --- |
| 361309726 | Pages: 문서 생성하기 | Apple | 15.4.2 | 6007 / Productivity | 있음 / 있음 | 성공 |
| 361304891 | Numbers: 스프레드시트 만들기 | Apple | 15.4.2 | 6007 / Productivity | 있음 / 있음 | 성공 |
| 361285480 | Keynote: 프레젠테이션 디자인하기 | Apple | 15.4.2 | 6007 / Productivity | 있음 / 있음 | 성공 |
| 408709785 | GarageBand | Apple | 2.3.20 | 6011 / Music | 있음 / 있음 | 성공 |
| 377298193 | iMovie | Apple | 3.0.6 | 6008 / Photo & Video | 있음 / 있음 | 성공 |
| 1232780281 | Notion: 메모, 작업, AI | Notion Labs, Incorporated | 1.7.350 | 6007 / Productivity | 있음 / 있음 | 성공 |
| 324684580 | Spotify (스포티파이) : 뮤직 & 팟캐스트 앱 | Spotify | 9.1.94 | 6011 / Music | 있음 / 있음 | 성공 |
| 311867728 | 네이버지도 - 장소의 발견과 예약, 내비게이션 | NAVER Corp. | 6.11.0 | 6010 / Navigation | 있음 / 있음 | 성공 |
| 362057947 | 카카오톡 KakaoTalk | Kakao Corp. | 26.9.1 | 6005 / Social Networking | 있음 / 있음 | 성공 |
| 544007664 | YouTube | Google | 21.43.5 | 6008 / Photo & Video | 있음 / 있음 | 성공 |

## 관찰 범위

- 원본의 앱 이름·개발사·버전·장르 식별자/이름과 필드 존재 여부만 `tests/fixtures/apple-observed.json`에 남긴다. 릴리스 노트 본문과 아이콘 파일은 복제하지 않는다.
- 위 결과는 특정 시점의 스토어 메타데이터 검증이다. iPhone Duo 지원 상태·기능·공식 근거·검토일을 의미하지 않는다.
- 지원하지 않는 장르는 가져온 초안에서 미분류로 남겨 관리자가 분류한다. 실제 앱 100개 검토 및 200개 후보 수집은 후속 콘텐츠 작업이다.
- 429·timeout·잘못된 JSON·과대 응답·국가/ID 불일치·누락 필드는 단위 테스트로 별도 재현한다. 실조회에서 발생하지 않은 장애를 관찰했다고 기록하지 않는다.

## 출처와 자산

[Apple Search API 문서](https://performance-partners.apple.com/search-api)를 기준으로 KR과 software를 명시한다. 요청별 URL·성공 시각은 JSON 기록에 포함된다.
API 아이콘 등의 판촉 자산에는 Apple 이용 조건이 적용된다. 현재 공개 화면은 자체 일반 아이콘을 사용한다. 외부 아이콘을 표시하기 전 `docs/assets.md`의 권리 검토를 완료해야 한다.
