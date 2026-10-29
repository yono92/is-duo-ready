# Contributing to Is Duo Ready?

코드, 앱 제보, 공식 근거, 한국어·영어 번역, 접근성 개선을 함께할 수 있습니다. 한국어와 영어 모두 환영합니다.
Code, app suggestions, official evidence, Korean/English translations, and accessibility improvements are welcome.

## 앱과 근거 / Apps and evidence

[앱·근거 이슈](https://github.com/yono92/is-duo-ready/issues/new?template=app-evidence.yml)에 KR App Store URL과 개발사·Apple의 공식 출처를 남겨주세요. 출처가 없다면 ‘확인 필요’로 제안하세요. 기기 대응 여부, 버전, 발표일과 사람이 실제 검토한 시각은 추측하거나 만들어 넣지 않습니다. 제보는 검토 전 제안이며 자동 공개되지 않습니다.

Use a KR App Store URL and primary sources. Label uncertain claims as unverified. Do not invent compatibility claims, release dates, or review timestamps. Suggestions remain proposals until reviewed.

## 코드 / Code

1. 저장소를 fork하고 작업 브랜치를 만듭니다. Fork the repository and create a focused branch.
2. README의 Node22·로컬 PostgreSQL 설정으로 실행합니다. Production 자격 증명을 사용하지 마세요.
3. `docs/PRD.md`, `DESIGN.md`, `AGENTS.md`, `docs/engineering-principles.md`와 관련 feature spec을 읽습니다.
4. 사용자 문구는 `src/messages/ko.json`, `en.json` 양쪽에 넣습니다. locale과 스토어 country KR을 혼동하지 마세요.
5. DB 변경은 새 migration과 RLS를 포함합니다. 기존 migration은 수정하지 않습니다.
6. 관련 검사와 아래 기본 검사를 실행하고 PR에 결과·제약을 기록합니다.

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npm run test:admin
npm run test:e2e
npm run build
npm run test:production
npm run test:production:db
```

테스트는 임시 DB를 사용하며 실제 앱 근거를 만들지 않습니다. UI 변경은 키보드·모바일·두 언어·두 테마를 확인하세요. 환경 파일, 키, DB/Storage 백업, 관리자 정보, 권리가 확인되지 않은 이미지를 커밋하지 마세요.

Keep pull requests focused. Explain the problem, resulting behavior and verification. Contributions use the repository's MIT license for original code; preserve third-party licenses and permissions. Respect other contributors and discuss technical disagreements with evidence.
