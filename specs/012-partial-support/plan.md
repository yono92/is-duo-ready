# 설계

- `src/lib/directory/types.ts`: `statuses`와 `publicStatuses`에 `partial`을 `supported` 다음에 둔다.
  공개 순서와 필터·집계·차트는 이 배열을 따른다.
- 배지: Astryx `Badge` `teal` 변형과 반쯤 채운 원 아이콘. 차트·범례 색은 `--color-data-categorical-teal`.
- `postgres-query.ts`: 정렬 CASE와 집계에 `partial`. `sitemap.ts`와 `content-quality.ts`의 근거 필수 목록에 `partial`.
- `db/migrations/010_partial_support.sql`: `app_support_status_check` 교체. 스냅샷 함수는 `unknown` 외 상태에
  공식 근거를 이미 요구하므로 변경하지 않는다.
- 메시지 ko/en: `Status`, `DirectoryStats`, `Info.statusDescriptions`.
- Fixture: 가상 앱 상태 순환에 `partial`을 포함한다(가상 표시 유지).

## 원칙 점검

I 근거 기반 판정: `partial`은 공식 근거를 요구하며 범위 불명을 요약에 밝힌다. 미지원 판정이 아니다.
II 수집과 승인 분리: 상태 반영은 검토 manifest와 승인 후 apply. III–VII 영향 없음(한영·테마·접근성 유지).
