import { expect, test } from 'vitest';
import { verifiedSessionId, liveHostedSession } from '../../src/lib/admin/hosted-session.mjs';

test('verified token claims must match user and live session before administrator authorization', async () => {
  const id = '12345678-1234-1234-1234-123456789012';
  const token = (sub: string) =>
    'header.' +
    Buffer.from(JSON.stringify({ sub, session_id: id })).toString('base64url') +
    '.signature';
  expect(verifiedSessionId(token('user'), 'user')).toBe(id);
  expect(verifiedSessionId(token('other'), 'user')).toBeNull();
  expect(verifiedSessionId('malformed', 'user')).toBeNull();
  for (const active of [true, false]) {
    const db = {
      query: async (_sql: string, params: string[]) => {
        expect(params).toEqual([id, 'user']);
        return { rows: [{ active }] };
      },
    };
    expect(await liveHostedSession(db, id, 'user')).toBe(active);
  }
});
