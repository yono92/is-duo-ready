// Builds src/data/source-scans.json from one completed, verified refresh directory.
// Summarizes what the official KR sources showed; never changes support decisions.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

type Page = {
  appStoreId: string;
  observedAt: string;
  error?: string;
  description?: string | null;
  versions?: { version: string | null; text: string }[];
  matchingText?: { path: string; text: string }[];
};
type Hit = { version: string | null; area: string; text: string };
type Decision = { decision: 'supported' | 'hold'; reason?: string };
type Outcome =
  | 'evidence_observed'
  | 'alternative_observed'
  | 'evidence_not_reobserved'
  | 'no_mention'
  | 'compatibility_only'
  | 'generic_foldable'
  | 'bug_fix_only'
  | 'unspecified_improvement'
  | 'preparing';
type Scan = {
  checkedAt: string;
  versions: number;
  outcome: Outcome;
  excerpt?: string;
  excerptVersion?: string | null;
};

const mention = /iphone\s*duo|\bduo\b|듀오|\bfold(?:able|ing|ed)?\b|폴더블|접히|접힘|펼친|펼침/iu;
// Hold reasons recorded in English by the refresh review, mapped to public categories.
// Reasons naming an unrelated meaning of "Duo"/"fold" are no iPhone Duo mention at all.
function holdOutcome(reason: string): Outcome {
  if (
    /unrelated|mascot|Duolingo|watch face|game mode|game-team|names a game|refers to controls/i.test(
      reason,
    )
  )
    return 'no_mention';
  if (/preparing|getting ready/i.test(reason)) return 'preparing';
  if (/bug fix|fixes only|untested/i.test(reason)) return 'bug_fix_only';
  if (/unspecified|vague|without a support declaration|do not specify/i.test(reason))
    return 'unspecified_improvement';
  if (/generic|foldable|folding iPhone|explicit Duo identity/i.test(reason))
    return 'generic_foldable';
  throw new Error(`Unclassified hold reason: ${reason}`);
}
// New chart apps are reviewed in the same refresh but not through existing-decisions.
const newHolds: Record<string, Outcome> = JSON.parse(process.env.NEW_HOLDS ?? '{}') as Record<
  string,
  Outcome
>;

function excerpt(text: string) {
  const match = mention.exec(text);
  if (!match) return text.slice(0, 200).trim();
  const sentences = text.split(/(?<=[.!?。])\s+|\n+/u);
  const sentence = sentences.find((part) => mention.test(part)) ?? text;
  return Array.from(sentence.trim()).slice(0, 220).join('');
}

const [root, refresh] = process.argv.slice(2);
assert.ok(
  root?.startsWith('.data/refresh-') && /^\d{4}-\d{2}-\d{2}$/.test(refresh ?? ''),
  'Use .data/refresh-DATE DATE',
);
const read = async <T>(path: string) => JSON.parse(await readFile(path, 'utf8')) as T;
const final = await read<{
  tables: Record<string, { snapshot: { storeUrl: string; status: string }; publication: string }[]>;
}>(`${root}/final-content.json`);
const pages = new Map(
  [
    ...(await read<{ pages: Page[] }>(`docs/data/refresh-pages-${refresh}.json`)).pages,
    ...(await read<{ pages: Page[] }>(`docs/data/refresh-new-pages-${refresh}.json`)).pages,
  ].map((page) => [page.appStoreId, page]),
);
const candidates = new Map(
  (await read<{ appStoreId: string; hits: Hit[] }[]>(`${root}/existing-candidates.json`)).map(
    (c) => [c.appStoreId, c],
  ),
);
const decisions = await read<Record<string, Decision>>(`${root}/existing-decisions.json`);
const evidence = new Map(
  (
    await read<{ appStoreId: string; anyEvidenceReobserved: boolean }[]>(
      `${root}/existing-evidence-check.json`,
    )
  ).map((e) => [e.appStoreId, e]),
);
const alternatives = new Set(
  (await read<{ appStoreId: string }[]>(`${root}/existing-evidence-refresh.json`)).map(
    (e) => e.appStoreId,
  ),
);
const confirmedToday = new Set(
  [
    ...(await read<{ changes: { appStoreId: string }[] }>(`${root}/reviewed-existing.json`))
      .changes,
    ...(await read<{ changes: { appStoreId: string }[] }>(`${root}/reviewed-new.json`)).changes,
  ].map((change) => change.appStoreId),
);
const newIds = new Set(
  (await read<{ selectedAppStoreIds: string[] }>(`${root}/rank-manifest.json`)).selectedAppStoreIds,
);

const apps: Record<string, Scan> = {};
for (const entry of final.tables['public.directory_entries']) {
  if (entry.publication !== 'published') continue;
  const id = /\/id([0-9]+)$/.exec(entry.snapshot.storeUrl)?.[1];
  assert.ok(id, 'Published entry without KR store identity');
  const page = pages.get(id);
  assert.ok(page && !page.error, `Published app without a successful page observation: ${id}`);
  const base = { checkedAt: page.observedAt, versions: page.versions?.length ?? 0 };
  if (entry.snapshot.status === 'supported') {
    const check = evidence.get(id);
    const outcome: Outcome =
      confirmedToday.has(id) || check?.anyEvidenceReobserved
        ? 'evidence_observed'
        : alternatives.has(id)
          ? 'alternative_observed'
          : 'evidence_not_reobserved';
    assert.ok(confirmedToday.has(id) || check, `Supported app missing from evidence check: ${id}`);
    apps[id] = { ...base, outcome };
    continue;
  }
  assert.ok(['unknown', 'unsupported'].includes(entry.snapshot.status), `Unexpected status ${id}`);
  let outcome: Outcome = 'no_mention';
  const decision = decisions[id];
  if (newIds.has(id) && newHolds[id]) outcome = newHolds[id];
  else if (decision?.decision === 'hold') outcome = holdOutcome(decision.reason ?? '');
  else assert.ok(!decision, `Unknown app has a non-hold decision: ${id}`);
  const compatibilityOnly = (page.matchingText ?? []).some(
    (text) => text.path.startsWith('information') && /iPhone Duo/.test(text.text),
  );
  if (outcome === 'no_mention' && compatibilityOnly) outcome = 'compatibility_only';
  const scan: Scan = { ...base, outcome };
  if (!['no_mention', 'compatibility_only'].includes(outcome)) {
    const hit =
      candidates.get(id)?.hits.find((h) => ['version', 'description'].includes(h.area)) ??
      [
        ...(page.versions ?? []).map((v) => ({ version: v.version, text: v.text })),
        { version: null, text: page.description ?? '' },
      ].find((h) => mention.test(h.text));
    assert.ok(hit, `Held app without an observable excerpt: ${id}`);
    scan.excerpt = excerpt(hit.text);
    scan.excerptVersion = hit.version?.trim() ?? null;
  }
  apps[id] = scan;
}

const counts = Object.values(apps).reduce<Record<string, number>>((all, scan) => {
  all[scan.outcome] = (all[scan.outcome] ?? 0) + 1;
  return all;
}, {});
const sorted = Object.fromEntries(Object.entries(apps).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(
  'src/data/source-scans.json',
  JSON.stringify({ version: 1, refresh, country: 'KR', apps: sorted }) + '\n',
);
console.log(JSON.stringify({ apps: Object.keys(apps).length, counts }));
