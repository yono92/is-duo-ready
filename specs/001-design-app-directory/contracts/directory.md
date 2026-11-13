# Directory UI and URL contract

- `/` negotiates locale; `/ko` and `/en` are authoritative. Unsupported prefix returns 404.
- `q`: names/aliases case-insensitive NFC substring search in BOTH languages, max 100 chars.
- 하나의 목록에 전체 공개 KR 앱을 포함한다. 새 URL은 `collection`을 생성하지 않는다.
  이전 `collection=core/all`은 통합 목록으로 해석한다. `collection=supported`는 유효한 명시적
  `status`가 없을 때만 `status=supported`로 해석한다. `status=all`도 명시적 선택이며 나머지
  검색어·분류·정렬·페이지를 보존한다. 검색과 지원 상태 변경은 다른 조건을 유지한다.
  지원 통계는 전체 공개 KR 앱을 분모로 하며 검색·필터와 독립적이다.
- `category`: productivity, graphics-design, music, books, travel, navigation, photo-video, entertainment, lifestyle; omitted/invalid = all.
  Legacy `creativity` is accepted as `graphics-design`; newly serialized URLs use the canonical slug.
  These internal slugs select a subset of official Apple category names, not the complete taxonomy
  or Apple API identifiers. Labels/sources: docs/references/app-store-categories.md.
- `status`: supported, planned, unknown, unsupported; omitted/invalid = all.
- `sort`: familiar (default), top-free, top-paid, recommended, updated, name.
  `familiar`는 편집 선정 또는 최신 KR 전체 무료 상위 100위 앱을 우선하고 각 그룹에서 무료
  순위·이름순으로 표시한다. 차트 자료가 없으면 편집 선정 여부와 이름순을 사용한다.
  무료/유료는 가격 필터가 아니라 별도의 KR 전체 차트이며 기존 공식 지원 우선·그룹 내
  순위/이름순 동작을 유지한다. 지원 우선·최근 지원 변경·이름순도 기존 계약을 유지한다.
- `page`: default 1; invalid = 1; beyond last page clamped. 24 items/page.
- Duplicate known params use first value. Unknown query keys are ignored by filtering.
- Recommended: supported first, then remaining groups (planned, unknown, unsupported), review descending,
  then localized name and slug. Updated uses supportChangedAt descending; names use locale collation.
- Query/filter/sort changes reset page; all controls derive from navigated URL. Back/forward restore controls.
- Locale links preserve path/query; cookie one-year, sameSite=lax. Locale NEVER changes country or category.
- Theme: initial system default follows OS; a single accessible light/dark role=switch reports the
  resolved dark state via aria-checked. Manual choice persists and stops following OS. No explicit
  system selection UI or theme URL parameter.
- `/[locale]/apps/[slug]`: fixture-only detail shell; retains query on locale switch; unknown/draft = 404.
- `/[locale]/updates`, `/submit`: honest scoped future-feature notices. No fake updates or submitting data.
- `/[locale]/methodology`: policy from PRD, independent service notice.
- 지원 상태 버튼은 검색 아래에서 모든 화면 크기에 노출하고 선택 상태를 접근성 속성으로 전달한다.
  모바일 카테고리 Dialog는 접근 가능한 제목/설명, 초점 가두기, Escape/닫기, 초점 복귀와 완료
  동작을 유지한다. 전체 통계는 기본 접힘 Astryx Collapsible로 열고 닫는다.
- No exposed public API, DB table, auth endpoint or external write in this feature.
