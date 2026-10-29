import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { collectionQueryOptions, CollectionQueryError } from '@/lib/operations/collection-query';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/admin/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin/auth')>()),
  assertAdmin: vi.fn(),
}));
vi.mock('@/lib/operations/repository', () => ({ collectionOverview: vi.fn() }));

import { AdminError, assertAdmin } from '@/lib/admin/auth';
import { collectionOverview } from '@/lib/operations/repository';
import { GET } from '@/app/api/admin/collections/route';

const overview = { targets: [], runs: [] };
beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('private collection overview API', () => {
  test('authorizes before reading and disables HTTP caching', async () => {
    vi.mocked(assertAdmin).mockResolvedValue('verified-actor');
    vi.mocked(collectionOverview).mockResolvedValue(overview);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(overview);
    expect(collectionOverview).toHaveBeenCalledWith('verified-actor');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  test.each([
    ['authRequired', 401],
    ['forbidden', 403],
    ['unavailable', 503],
  ] as const)('denies %s without querying private data', async (code, status) => {
    vi.mocked(assertAdmin).mockRejectedValue(new AdminError(code));
    const response = await GET();
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
    expect(collectionOverview).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  test('does not return database failure details', async () => {
    vi.mocked(assertAdmin).mockResolvedValue('verified-actor');
    vi.mocked(collectionOverview).mockRejectedValue(new Error('private database diagnostic'));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable' });
  });
});

describe('collection query cache', () => {
  test('preserves the last successful result on refresh failure and recovers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(overview))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json(overview));
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient();
    const options = { ...collectionQueryOptions(), staleTime: 0, retry: false };
    try {
      await expect(client.fetchQuery(options)).resolves.toEqual(overview);
      await expect(client.fetchQuery(options)).rejects.toBeInstanceOf(CollectionQueryError);
      expect(client.getQueryData(options.queryKey)).toEqual(overview);
      await expect(client.fetchQuery(options)).resolves.toEqual(overview);
      expect(client.getQueryState(options.queryKey)?.error).toBeNull();
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/collections',
        expect.objectContaining({
          cache: 'no-store',
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        }),
      );
    } finally {
      client.clear();
    }
  });

  test.each([401, 403])('does not retry access failures (%s)', async (status) => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(null, { status }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient();
    try {
      await expect(client.fetchQuery(collectionQueryOptions())).rejects.toMatchObject({ status });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      client.clear();
    }
  });
});
