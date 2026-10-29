# 상태 관리 기준

## 현재 책임

| 상태 | 관리 위치 |
| --- | --- |
| 공개 앱 목록·상세 | Server Component와 서버 데이터 저장소 |
| 검색·필터·정렬·페이지 | URL 쿼리 (`src/lib/directory/query.ts`) |
| 단일 폼 입력·열림 상태 | React `useState` / `useActionState` |
| 테마·언어 | next-themes / next-intl 및 locale URL |
| 관리자 출처 수집 현황 | TanStack Query (`@tanstack/react-query` 5.105.0) |

## 관리자 조회 패턴

출처 수집 페이지는 서버에서 권한 확인과 초기 조회를 수행한 뒤 `CollectionDashboard`에 결과를 전달한다. 화면 아래의 `AdminQueryProvider`가 인스턴스별 QueryClient를 만든다. 모듈 전역 singleton이나 localStorage 영구 캐시는 사용하지 않는다. 관리자가 바뀌면 provider key가 바뀌고, 화면의 조회 구독이 제거되면 `gcTime: 0`으로 비활성 캐시를 제거한다. 공개 페이지에는 provider를 추가하지 않는다.

`collectionQueryOptions()`가 `['admin', 'collections']` 키, 조회 함수, 재시도와 갱신 정책을 정의한다. 현재 결과는 언어에 독립적인 원본 데이터이고 메시지·날짜는 화면 locale로 표현하므로 locale을 query key에 넣지 않는다. 향후 조회 인자나 국가가 추가되면 결과를 결정하는 값을 반드시 key에 포함한다.

- 초기 서버 조회 시각을 `initialDataUpdatedAt`으로 전달하며 staleTime은 10초다.
- 활성 탭에서 15초마다 **현황만 조회**한다. 출처 수집은 기존 명시적 Server Action/worker가 실행한다.
- 창 활성화·네트워크 복구 시 오래된 결과를 다시 조회한다. 숨겨진 탭에서 주기 조회하지 않는다.
- fetch에는 취소 신호, same-origin 자격 증명, no-store를 전달한다.
- `GET /api/admin/collections`는 매번 `assertAdmin`을 수행하며 성공·오류 모두 `Cache-Control: private, no-store`다. 서버 내부 예외는 반환하지 않는다.
- 일시적 조회 실패는 한 번 재시도한 뒤 마지막 결과와 갱신 실패 안내를 표시한다. 수동 새로고침도 제공한다. 실제 빈 결과와 오류를 구분한다.
- 401/403은 재시도하지 않고 비공개 목록·조작 UI를 숨긴다. 주기 조회와 창 활성화/연결 복구 자동 조회도 중단하며 로그인 동선을 제공한다.

수집 화면의 `OperationForm.onComplete`는 액션 응답 뒤 해당 키를 무효화한다. 실패한 수집도 실행·오류 기록을 바꿀 수 있으므로 성공 여부와 무관하게 다시 읽는다. 서버 액션의 기존 권한 검사·트랜잭션·`revalidatePath`는 유지한다. Next.js 서버 캐시 재검증만으로 Query 캐시가 갱신된다고 가정하지 않는다. 콜백을 사용하지 않는 검토 폼은 기존 Server Action 연결을 그대로 사용한다.

## 확장 기준

관리자 화면에 주기적 조회나 조회 결과 공유가 더 필요해지면 이 패턴을 적용하되, 인증 경계와 QueryClient 수명을 먼저 정한다. 전역 provider로 이동하거나 로그인 사용자 사이에 캐시를 공유하지 않는다. 공개 서버 조회를 일괄적으로 Query로 옮기지 않는다.

Zustand는 아직 추가하지 않는다. 앱 비교 선택 등 여러 화면이 실제로 공유하는 클라이언트 상태를 구현할 때 도입한다. 그때도 검색 필터의 기준은 URL, 서버 데이터의 기준은 서버/Query로 유지하고 같은 데이터를 두 스토어에 복제하지 않는다. 서버 렌더링 환경에서는 요청별 스토어와 초기값 일치를 검증한다.

## 참고

- [TanStack Query: Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [TanStack Query: Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Zustand: Next.js guide](https://zustand.docs.pmnd.rs/learn/guides/nextjs)
- 설치된 Next.js 문서: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, `05-server-and-client-components.md`
