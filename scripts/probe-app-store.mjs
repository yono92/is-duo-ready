import { writeFile } from 'node:fs/promises';
import { lookupApple, ImportError } from '../src/lib/import/apple.mjs';

// Read-only Apple KR probe: never connects to the application database.
const ids = [
  '361309726',
  '361304891',
  '361285480',
  '408709785',
  '377298193',
  '1232780281',
  '324684580',
  '311867728',
  '362057947',
  '544007664',
];
const observations = [];
const startedAt = new Date().toISOString();
for (const id of ids) {
  const attempts = [];
  let sample;
  try {
    const result = await lookupApple(id, {
      fetcher: async (url, options) => {
        attempts.push(new Date().toISOString());
        const response = await fetch(url, options);
        // The shared bounded reader validates the actual response first. Retain only factual metadata below.
        return response;
      },
    });
    const { release_notes, icon_url, ...metadata } = result;
    sample = {
      metadata,
      releaseNotesPresent: release_notes !== null,
      releaseNotesCharacters: release_notes?.length ?? 0,
      iconUrlPresent: icon_url !== null,
    };
    console.log(`${id}: ${result.name} (${result.current_version ?? 'version missing'})`);
  } catch (error) {
    sample = { error: error instanceof ImportError ? error.code : 'unavailable' };
    console.log(`${id}: ${sample.error}`);
  }
  observations.push({
    id,
    country: 'KR',
    source: `https://itunes.apple.com/lookup?id=${id}&country=kr&entity=software`,
    attemptedAt: attempts,
    ...sample,
  });
}
const report = {
  startedAt,
  completedAt: new Date().toISOString(),
  purpose: 'Observed store metadata only; no support assessment or human review.',
  observations,
};
await writeFile('tests/fixtures/apple-observed.json', `${JSON.stringify(report, null, 2)}\n`);
const successes = observations.filter((item) => item.metadata).length;
const lines = [
  '# 한국 App Store API 검증',
  '',
  `실행: ${report.startedAt} ~ ${report.completedAt} (UTC).`,
  '',
  '`node scripts/probe-app-store.mjs`로 같은 가져오기 모듈을 실행했다. DB 연결·초안 생성·공개 판정은 하지 않는다.',
  '각 요청은 KR 고정, 최소 3초 간격, 8초 제한, 최대 2회 재시도를 적용한다. 수집 시각은 사람의 검토일이 아니다.',
  '',
  `결과: ${successes}/${ids.length}개 응답 정규화 성공.`,
  '',
  '| ID | 실제 응답 이름 | 개발사 | 현재 버전 | 기본 장르 | 릴리스 노트 / 아이콘 URL | 결과 |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...observations.map((item) => {
    const m = item.metadata;
    const safe = (s) =>
      String(s ?? '누락')
        .replaceAll('|', '\\|')
        .replaceAll('\n', ' ');
    return `| ${item.id} | ${safe(m?.name)} | ${safe(m?.developer)} | ${safe(m?.current_version)} | ${safe(m?.primary_genre_id)} / ${safe(m?.primary_genre_name)} | ${m ? `${item.releaseNotesPresent ? '있음' : '없음'} / ${item.iconUrlPresent ? '있음' : '없음'}` : '—'} | ${m ? '성공' : item.error} |`;
  }),
  '',
  '## 관찰 범위',
  '',
  '- 원본의 앱 이름·개발사·버전·장르 식별자/이름과 필드 존재 여부만 `tests/fixtures/apple-observed.json`에 남긴다. 릴리스 노트 본문과 아이콘 파일은 복제하지 않는다.',
  '- 위 결과는 특정 시점의 스토어 메타데이터 검증이다. iPhone Duo 지원 상태·기능·공식 근거·검토일을 의미하지 않는다.',
  '- 지원하지 않는 장르는 가져온 초안에서 미분류로 남겨 관리자가 분류한다. 실제 앱 100개 검토 및 200개 후보 수집은 후속 콘텐츠 작업이다.',
  '- 429·timeout·잘못된 JSON·과대 응답·국가/ID 불일치·누락 필드는 단위 테스트로 별도 재현한다. 실조회에서 발생하지 않은 장애를 관찰했다고 기록하지 않는다.',
  '',
  '## 출처와 자산',
  '',
  '[Apple Search API 문서](https://performance-partners.apple.com/search-api)를 기준으로 KR과 software를 명시한다. 요청별 URL·성공 시각은 JSON 기록에 포함된다.',
  'API 아이콘 등의 판촉 자산에는 Apple 이용 조건이 적용된다. 현재 공개 화면은 자체 일반 아이콘을 사용한다. 외부 아이콘을 표시하기 전 `docs/assets.md`의 권리 검토를 완료해야 한다.',
  '',
];
await writeFile('docs/import-validation.md', lines.join('\n'));
if (successes !== ids.length) process.exitCode = 1;
