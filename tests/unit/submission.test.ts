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

function usageInput() {
  const form = input();
  Object.entries({
    kind: 'usage',
    evidence_url: '',
    device_model: 'iPhone Duo',
    environment: 'device',
    os_version: '27.1',
    app_version: '2.3',
    display_mode: 'transition',
    result: 'issues',
    observed_on: '2026-01-01',
    locale: 'ko',
    publish_consent: 'on',
  }).forEach(([key, value]) => form.set(key, value));
  return form;
}

it('accepts structured usage without an official source and excludes forged approval', () => {
  const result = parseSubmission(usageInput());
  expect(result).toMatchObject({
    kind: 'usage',
    evidence_url: null,
    locale: 'ko',
    publish_consent: true,
    usage: {
      device_model: 'iPhone Duo',
      environment: 'device',
      app_version: '2.3',
      os_version: '27.1',
      display_mode: 'transition',
      result: 'issues',
      observed_on: '2026-01-01',
    },
  });
  expect(result).not.toHaveProperty('state');
  expect(result).not.toHaveProperty('screenshot_base64');
});

it('requires consent, real dates and bounded device/version observations', () => {
  for (const [key, value] of [
    ['publish_consent', 'false'],
    ['locale', 'ja'],
    ['device_model', ''],
    ['device_model', 'x'.repeat(81)],
    ['environment', 'guess'],
    ['os_version', ''],
    ['app_version', ''],
    ['display_mode', 'all'],
    ['result', 'supported'],
    ['observed_on', '2026-02-30'],
    ['observed_on', '2999-01-01'],
    ['observed_on', '2026-1-1'],
    ['evidence_url', 'https://127.0.0.1/private'],
  ]) {
    const form = usageInput();
    form.set(key, value);
    expect(() => parseSubmission(form), key).toThrow();
  }
  const form = usageInput();
  form.set('os_version', new File(['27.1'], 'version.txt'));
  expect(() => parseSubmission(form)).toThrow();
});
