import { expect, test } from 'vitest';
import { indexingAllowed } from '@/lib/data/seo';
test('indexing requires deliberate production and real-data configuration', () => {
  const env = {
    PUBLIC_INDEXING: 'true',
    NODE_ENV: 'production',
    VERCEL_ENV: 'production',
    DIRECTORY_DATA_SOURCE: 'postgres',
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
  };
  expect(indexingAllowed(env)).toBe(true);
  for (const change of [
    { PUBLIC_INDEXING: '' },
    { NODE_ENV: 'development' },
    { VERCEL_ENV: 'preview' },
    { DIRECTORY_DATA_SOURCE: 'fixtures' },
    { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
    { NEXT_PUBLIC_SITE_URL: 'https://localhost' },
    { NEXT_PUBLIC_SITE_URL: 'https://preview.internal' },
  ])
    expect(indexingAllowed({ ...env, ...change })).toBe(false);
});
