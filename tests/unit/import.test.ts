import { expect, test } from 'vitest';
import { parseImport } from '@/lib/import/input';
import { appleId, lookupApple, normalizeApple } from '@/lib/import/apple.ts';

const url = 'https://apps.apple.com/kr/app/test/id123456';
const response = {
  resultCount: 1,
  results: [
    {
      wrapperType: 'software',
      trackId: 123456,
      trackName: 'Observed name',
      artistName: 'Observed developer',
      trackViewUrl: url,
    },
  ],
};

test('store URLs are parsed to IDs, never treated as arbitrary fetch destinations', () => {
  expect(appleId(`${url}?l=en`)).toBe('123456');
  for (const value of [
    'http://apps.apple.com/kr/app/id123456',
    'https://apps.apple.com/us/app/id123456',
    'https://apps.apple.com.evil.com/kr/app/id123456',
    'https://user@apps.apple.com/kr/app/id123456',
    'https://127.0.0.1/kr/app/id123456',
    `${url}/extra`,
  ])
    expect(() => appleId(value)).toThrow();
});

test('CSV preserves quoted commas, newlines and escaped quotes; errors remain per-row', () => {
  const rows = parseImport(
    '\uFEFFapp_store_url,source_url,evidence_summary\r\n' +
      `${url},https://example.com/,"A, B\r\n""quote"""\r\ninvalid,,\r\n`,
    'csv',
  );
  expect(rows).toHaveLength(2);
  expect(rows[0].proposal.evidence_summary).toBe('A, B\r\n"quote"');
  expect(rows[0].appStoreId).toBe('123456');
  expect(rows[1].error).toBe('invalidUrl');
  expect(parseImport(`${url}\n\n${url}`, 'urls')).toHaveLength(2);
});

test('CSV rejects ambiguous headers, malformed quoting, unsafe proposals and resource excess', () => {
  for (const csv of [
    'app_store_url,app_store_url\na,b',
    'app_store_url,unknown\na,b',
    'source_url\na',
    'app_store_url\n"unclosed',
    'app_store_url\n"a"oops',
    'app_store_url\na"b',
  ])
    expect(() => parseImport(csv, 'csv')).toThrow();
  expect(() => parseImport('a'.repeat(524289), 'urls')).toThrow();
  expect(() => parseImport(Array(201).fill(url).join('\n'), 'urls')).toThrow();
  expect(parseImport(`app_store_url,source_url\n${url},https://localhost/x`, 'csv')[0].error).toBe(
    'invalidProposal',
  );
  expect(parseImport(`app_store_url,announced_at\n${url},2026-02-30`, 'csv')[0].error).toBe(
    'invalidProposal',
  );
  expect(parseImport(`app_store_url\n${url},extra`, 'csv')[0].error).toBe('columns');
});

test('Apple normalization preserves missing fields and rejects mismatched country, identity or response shape', () => {
  expect(normalizeApple(response, '123456')).toMatchObject({
    name: 'Observed name',
    category: null,
    current_version: null,
    release_notes: null,
    icon_url: null,
  });
  for (const value of [
    { resultCount: 0, results: [] },
    { ...response, resultCount: 2 },
    { ...response, results: [{ ...response.results[0], trackId: 999 }] },
    {
      ...response,
      results: [{ ...response.results[0], trackViewUrl: url.replace('/kr/', '/us/') }],
    },
    { ...response, results: [{ ...response.results[0], artistName: '' }] },
  ])
    expect(() => normalizeApple(value, '123456')).toThrow();
});

test('lookup uses fixed KR endpoint, bounded retries and spacing, and rejects oversized content', async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const waits: number[] = [];
  let now = 0;
  const result = await lookupApple('123456', {
    fetcher: async (input: string, init?: RequestInit) => {
      requests.push({ url: input, init });
      return requests.length === 1
        ? new Response('', { status: 429, headers: { 'retry-after': '999999' } })
        : Response.json(response);
    },
    beforeAttempt: async () => {
      waits.push(3000);
      now += 3000;
    },
    sleep: async (ms: number) => {
      waits.push(ms);
      now += ms;
    },
    now: () => now,
  });
  expect(result.app_store_id).toBe('123456');
  expect(requests).toHaveLength(2);
  expect(requests[0].url).toBe(
    'https://itunes.apple.com/lookup?id=123456&country=kr&entity=software',
  );
  expect(requests[0].init?.redirect).toBe('error');
  expect(waits).toEqual([3000, 5000, 3000]);
  let calls = 0;
  const noWait = { beforeAttempt: async () => {}, sleep: async () => {} };
  await expect(
    lookupApple('123456', {
      ...noWait,
      fetcher: async () => {
        calls++;
        throw new Error('network');
      },
    }),
  ).rejects.toThrow('network');
  expect(calls).toBe(3);
  await expect(
    lookupApple('123456', { ...noWait, fetcher: async () => new Response('x'.repeat(2097153)) }),
  ).rejects.toThrow('oversized');
  await expect(
    lookupApple('123456', { ...noWait, fetcher: async () => new Response('not JSON') }),
  ).rejects.toThrow('malformed');
  await expect(
    lookupApple('123456', { ...noWait, fetcher: async () => new Response('', { status: 404 }) }),
  ).rejects.toThrow('http');
  await expect(
    lookupApple('123456', {
      ...noWait,
      timeoutMs: 5,
      fetcher: async (_: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    }),
  ).rejects.toThrow('timeout');
});
