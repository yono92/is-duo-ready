import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { database } from '@/lib/db/server';

test('malformed database configuration does not expose the submitted connection string', async () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'malformed-connection-with-never-print-secret';
  try {
    const error = await database(null, async () => {}).catch((value: unknown) => value);
    expect(error).toMatchObject({ message: 'Database operation failed.', code: 'ERR_INVALID_URL' });
    expect(JSON.stringify(error)).not.toContain('never-print-secret');
    expect(error).not.toHaveProperty('input');
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
