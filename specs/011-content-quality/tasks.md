# 작업 목록

- [x] T001 운영 배포 파일 해시와 작업 트리를 대조하고 운영 코드를 main에 커밋한다.
- [x] T002 소개 페이지·푸터·SEO·sitemap.
- [x] T003 갱신 리포트 데이터(11-20·11-23)·목록/상세 라우트·헤더/푸터·SEO.
- [x] T004 최근 확인 내역 데이터 생성 스크립트·JSON·상세 섹션.
- [x] T005 같은 카테고리의 지원 확인 앱 조회·상세 섹션.
- [x] T006 광고 허용 경로 확장과 편집 검토 목록.
- [x] T007 unknown 상세 noindex·sitemap 선택 색인.
- [x] T008 단위·E2E·빌드 검증과 기록.

결과: 소개 1쌍, 리포트 2건(11-20 23개·11-23 14개), 공개 앱 1,745개의 확인 내역, 카테고리 대안,
광고 검토 경로 6개(지원 안내·리포트, 앱 상세 0개), unknown 상세 noindex. 운영 배포·색인 환경 전환·Google
재심사는 수행하지 않았다. 검증 기록은 docs/verification.md 2026-11-23 콘텐츠 품질 절.

## 운영 후속 — 2026-11-23

- [x] T009 Search Console: URL 접두어 속성 소유권을 HTML 파일(`public/google277faabf93091765.html`, 운영 200)로
  확인하고 사용자가 `sitemap.xml`을 제출했다(상태 성공, 사용자 확인). DNS 방식은 vercel.app이라 쓸 수 없었다.
  IndexNow 키 파일은 사용자 결정으로 삭제했고 배포되지 않았다.
- [x] T010 아이콘 모서리: 실제 아이콘 이미지는 16px(`rounded-xl` = `--radius-xl: 1rem`), 틀은 12px에
  placeholder 배경이라 모든 실제 아이콘 모서리에 배경이 보였다. 이미지가 있으면 틀이 단독으로 자르고 배경을
  투명하게 했다(`f9b8bab`). 운영 홈에 같은 규칙을 적용한 전후 비교, lint/typecheck·단위 139개·관련 E2E 19개 통과.
  배포 `dpl_9B3ntpanQCsH3NbVeo5692G4bEF9` Ready 후 운영 HTML에 `app-icon-image`와 새 이미지 클래스가 반영됐다.
- [x] T011 보관 해제 2개(Holy Rosary·Oxford Deluxe) — docs/data-update-2026-11-23.md 후속 절.
