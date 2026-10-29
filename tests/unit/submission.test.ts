import { expect, it } from 'vitest';
import { parseSubmission } from '../../src/lib/operations/input';
function input() {
  const form = new FormData();
  Object.entries({
    kind: 'correction',
    store_url: 'https://apps.apple.com/kr/app/test/id123456?utm_source=test',
    body: 'A test correction with evidence',
    evidence_url: 'https://example.com/source',
    actor: 'forged',
    state: 'approved',
  }).forEach(([k, v]) => form.set(k, v));
  return form;
}
it('canonicalizes the store URL and drops caller-controlled identity/state', () => {
  const result = parseSubmission(input());
  expect(result.store_url).toBe('https://apps.apple.com/kr/app/id123456');
  expect(result).not.toHaveProperty('actor');
  expect(result).not.toHaveProperty('state');
});
it('rejects honeypot, invalid kind, unsafe URLs and invalid report sizes', () => {
  for (const [key, value] of [
    ['website', 'bot'],
    ['kind', 'approved'],
    ['body', 'short'],
    ['body', 'x'.repeat(4001)],
    ['store_url', 'https://apps.apple.com/us/app/id123456'],
    ['evidence_url', 'http://localhost/private'],
    ['evidence_url', 'https://user:pass@example.com/private'],
    ['evidence_url', 'https://127.0.0.1/private'],
  ]) {
    const form = input();
    form.set(key, value);
    expect(() => parseSubmission(form)).toThrow();
  }
});

it('rejects uploaded content in a text-only field', () => {
  const form = input();
  form.set('body', new File(['text'], 'report.txt'));
  expect(() => parseSubmission(form)).toThrow();
});
