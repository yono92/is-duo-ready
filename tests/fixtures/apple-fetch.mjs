// Test-process preload only: production source has no mock import path.
const url = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.DUO_TEST_RUN !== '1' ||
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL ||
  !/^\/duo_test_[a-f0-9]{32}$/.test(url.pathname) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
)
  throw new Error('Apple fixture preload requires an isolated local test database.');
const original = globalThis.fetch;
const attempts = new Map();
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const id = url.searchParams.get('id') ?? '';
  if (url.origin !== 'https://itunes.apple.com' || url.pathname !== '/lookup')
    return original(input, init);
  if (!/^990004\d+$/.test(id) || url.searchParams.get('country') !== 'kr')
    throw new Error('Unexpected external store request in deterministic test');
  if (id.endsWith('99')) {
    const count = (attempts.get(id) ?? 0) + 1;
    attempts.set(id, count);
    if (count <= 3) return new Response('', { status: 503 });
  }
  return Response.json({
    resultCount: 1,
    results: [
      {
        wrapperType: 'software',
        trackId: Number(id),
        trackViewUrl: `https://apps.apple.com/kr/app/id${id}`,
        trackName: `Fictional import ${id}`,
        artistName: 'Test only developer',
        version: '1.0',
        primaryGenreId: 6007,
        primaryGenreName: 'Productivity',
        releaseNotes: 'Fictional test metadata. No support assertion.',
      },
    ],
  });
};
