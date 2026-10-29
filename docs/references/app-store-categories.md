# App Store 카테고리 기준

확인일: 2026-10-29 (Asia/Seoul)

Is Duo Ready?는 iPhone 앱과 한국 App Store 데이터를 다루므로 Apple의 공식 카테고리 이름을
사용한다. Google Play 분류를 사용하지 않는다. 기존 `creativity` / 창작·디자인은 프로젝트의
임의 분류였으며 Apple 공식 명칭인 그래픽 및 디자인으로 정정했다.

## 공식 출처

- [Apple Developer — 카테고리 선택하기 (한국어)](https://developer.apple.com/kr/app-store/categories/)
- [Apple Developer — Choosing a category (English)](https://developer.apple.com/app-store/categories/)

Apple은 기본 카테고리와 보조 카테고리를 구분하며 기본 카테고리가 앱의 주요 경험을
정확하게 나타내도록 안내한다. 아래 이름은 공식 문서의 한국어·영어 표기를 따른다.

## 현재 목록에 있는 공식 분류 일부

전체 App Store 분류 체계를 구현한 목록이 아니다. 현재 가상 앱 목록에 필요한 9개 분류만
포함한다. `slug`는 프로젝트에서 URL과 메시지 키에 사용하는 내부 식별자이며 Apple의
공식 API 식별자 또는 공식 slug라는 의미가 아니다.

| 내부 slug         | 한국어           | English           |
| ----------------- | ---------------- | ----------------- |
| `productivity`    | 생산성           | Productivity      |
| `graphics-design` | 그래픽 및 디자인 | Graphics & Design |
| `music`           | 음악             | Music             |
| `books`           | 도서             | Books             |
| `travel`          | 여행             | Travel            |
| `navigation`      | 내비게이션       | Navigation        |
| `photo-video`     | 사진 및 비디오   | Photo & Video     |
| `entertainment`   | 엔터테인먼트     | Entertainment     |
| `lifestyle`       | 라이프스타일     | Lifestyle         |

## 데이터 적용 정책

- 현재 fixture의 카테고리는 각 가상 설명에 맞춰 명시적으로 지정한 UI 예시다. Apple에서
  조회하거나 검증한 실제 앱 메타데이터가 아니며 가상 앱의 스토어 등록을 의미하지 않는다.
- 실데이터 도입 시 한국 App Store 응답의 기본 장르 식별자와 이름을 보존하고, 검증된 매핑으로
  내부 분류에 연결한다. 이름·아이콘·설명만 보고 실제 앱의 카테고리를 임의 판정하지 않는다.
- 이후 실제 목록에 다른 공식 카테고리가 등장하면 해당 분류와 두 언어 메시지를 함께 추가한다.
  미확인 장르를 기존 분류로 조용히 대체하지 않는다. 보조 카테고리는 별도 요구사항으로 다룬다.
- 표시 언어가 영어여도 데이터 지역은 KR이다. 언어 전환으로 앱의 분류나 스토어 국가가 바뀌지 않는다.
- 과거 공유 URL의 `category=creativity`는 `graphics-design`으로 정규화한다.
  새로 생성하는 URL에는 `graphics-design`을 쓴다.
- 카테고리 수정은 지원 상태·근거·확인일과 독립적이다. 빈 근거와 null 검토일을 유지한다.

## Initial full-directory expansion (2026-10-29)

The initial KR Lookup observations also include Reference 6006, Sports 6004, Utilities 6002, Games 6014, Food & Drink 6023, Shopping 6024, Finance 6015, Education 6017, Business 6000, Health & Fitness 6013, Weather 6001, News 6009 and Social Networking 6005. Preserve these observed IDs/names and map them to the corresponding locale labels; migration 006 expands the existing constraint without changing RLS. Source: stored KR Apple Lookup observations in `app_store_listings.observed_metadata`, fetched on 2026-10-29.
