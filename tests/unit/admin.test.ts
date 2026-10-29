import { expect, test } from 'vitest';
import { emptyDraft, parseDraft, publicSourceUrl } from '@/lib/admin/input';

test('admin payload strips forged publication, actor and review fields and validates required values', () => {
  const draft = {
    ...emptyDraft,
    app_store_id: '12345',
    slug: 'test-app',
    name: 'Test app',
    developer: 'Test only',
    actor: 'forged',
    publication: 'published',
    reviewed_at: '2000-01-01',
  };
  const parsed = parseDraft(JSON.stringify(draft));
  expect(parsed).not.toHaveProperty('actor');
  expect(parsed).not.toHaveProperty('publication');
  expect(parsed).not.toHaveProperty('reviewed_at');
  expect(() => parseDraft(JSON.stringify({ ...draft, name: '' }))).toThrow();
  expect(() =>
    parseDraft(JSON.stringify({ ...draft, aliases: Array(51).fill('alias') })),
  ).toThrow();
  expect(() => parseDraft(JSON.stringify({ ...draft, id: 'forged', revision: 1 }))).toThrow();
});

test('source links reject script, credentials, internal hosts and malformed dates', () => {
  for (const url of [
    'javascript:alert(1)',
    'https://localhost/test',
    'https://127.0.0.1/test',
    'https://user:password@example.com/test',
    'https://service.internal/test',
    'https://example.com:8080/test',
  ]) {
    expect(() => publicSourceUrl(url)).toThrow();
  }
  expect(publicSourceUrl('https://example.com')).toBe('https://example.com/');
  const evidence = {
    url: 'https://example.com/test',
    title: 'Test only',
    kind: 'developer',
    quote: 'Test only',
    official_confirmed: false,
    announced_at: '2026-02-30',
    support_version: '',
    features: [],
  };
  expect(() =>
    parseDraft(
      JSON.stringify({
        ...emptyDraft,
        app_store_id: '123',
        slug: 'test',
        name: 'Test',
        developer: 'Test',
        evidence: [evidence],
      }),
    ),
  ).toThrow();
});
