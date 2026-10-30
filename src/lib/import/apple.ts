export interface AppleLookupOptions {
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
  beforeAttempt?: () => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
}
// Shared by server imports and the read-only real-App-Store probe. No caller URL is fetched.
export class ImportError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function appleId(raw: unknown) {
  if (typeof raw !== 'string' || raw.length > 2000) throw new ImportError('invalidUrl');
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new ImportError('invalidUrl');
  }
  const match = url.pathname.match(/^\/kr\/app\/(?:[^/]+\/)?id([1-9][0-9]{0,19})$/);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'apps.apple.com' ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    !match
  )
    throw new ImportError('invalidUrl');
  return match[1];
}

export const categoryIds: Record<string, string> = {
  6007: 'productivity',
  6027: 'graphics-design',
  6011: 'music',
  6018: 'books',
  6003: 'travel',
  6010: 'navigation',
  6008: 'photo-video',
  6016: 'entertainment',
  6012: 'lifestyle',
  6006: 'reference',
  6004: 'sports',
  6002: 'utilities',
  6014: 'games',
  6023: 'food-drink',
  6024: 'shopping',
  6015: 'finance',
  6017: 'education',
  6000: 'business',
  6013: 'health-fitness',
  6001: 'weather',
  6009: 'news',
  6005: 'social-networking',
};
function field(value: unknown, max: number, required = false) {
  if (value == null || value === '') {
    if (required) throw new ImportError('malformed');
    return null;
  }
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new ImportError('malformed');
  return value.trim();
}

export function normalizeApple(input: unknown, id: string) {
  const data = input as { resultCount?: unknown; results?: unknown[] } | null;
  if (data?.resultCount === 0 && Array.isArray(data.results) && data.results.length === 0)
    throw new ImportError('notFound');
  if (data?.resultCount !== 1 || !Array.isArray(data.results) || data.results.length !== 1)
    throw new ImportError('malformed');
  const item = data.results[0] as Record<string, unknown> | null;
  if (
    !item ||
    item.wrapperType !== 'software' ||
    !Number.isSafeInteger(item.trackId) ||
    String(item.trackId) !== id
  )
    throw new ImportError('malformed');
  try {
    if (appleId(item.trackViewUrl) !== id) throw new Error();
  } catch {
    throw new ImportError('countryMismatch');
  }
  const icon = field(item.artworkUrl512 ?? item.artworkUrl100, 2000);
  if (icon) {
    let parsed;
    try {
      parsed = new URL(icon);
    } catch {
      throw new ImportError('malformed');
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
      throw new ImportError('malformed');
  }
  return {
    app_store_id: id,
    name: field(item.trackName, 200, true),
    developer: field(item.artistName, 200, true),
    category: categoryIds[String(item.primaryGenreId)] ?? null,
    primary_genre_id: item.primaryGenreId == null ? null : String(item.primaryGenreId).slice(0, 30),
    primary_genre_name: field(item.primaryGenreName, 200),
    store_url: `https://apps.apple.com/kr/app/id${id}`,
    current_version: field(item.version, 100),
    release_notes: field(item.releaseNotes, 20000),
    icon_url: icon,
  };
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let lastStart = 0;
async function defaultSpacing() {
  await delay(Math.max(0, lastStart + 3000 - Date.now()));
  lastStart = Date.now();
}

async function boundedJson(response: Response): Promise<unknown> {
  if (Number(response.headers.get('content-length')) > 2097152) throw new ImportError('oversized');
  if (!response.body) throw new ImportError('malformed');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2097152) throw new ImportError('oversized');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ImportError('malformed');
  }
}

async function requestApple(ids: string[], options: AppleLookupOptions = {}) {
  const {
    fetcher = fetch,
    beforeAttempt = defaultSpacing,
    sleep = delay,
    now = Date.now,
    timeoutMs = 8000,
  } = options;
  for (let attempt = 0; attempt < 3; attempt++) {
    await beforeAttempt();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let retryAfter = 0;
    try {
      const response = await fetcher(
        `https://itunes.apple.com/lookup?id=${ids.join(',')}&country=kr&entity=software`,
        {
          redirect: 'error',
          signal: controller.signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        },
      );
      if (!response.ok) {
        const header = response.headers.get('retry-after');
        retryAfter =
          header && /^\d+$/.test(header)
            ? Number(header) * 1000
            : Math.max(0, Date.parse(header ?? '') - now()) || 0;
        await response.body?.cancel();
        throw new ImportError(
          response.status === 429 ? 'rateLimited' : response.status >= 500 ? 'upstream' : 'http',
        );
      }
      return { data: await boundedJson(response), fetched_at: new Date(now()).toISOString() };
    } catch (error) {
      const safe = controller.signal.aborted
        ? new ImportError('timeout')
        : error instanceof ImportError
          ? error
          : new ImportError('network');
      if (attempt === 2 || !['timeout', 'network', 'rateLimited', 'upstream'].includes(safe.code))
        throw safe;
      clearTimeout(timer);
      await sleep(Math.min(5000, Math.max(1000 * 2 ** attempt, retryAfter)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new ImportError('network');
}

export async function lookupApple(id: string, options: AppleLookupOptions = {}) {
  if (!/^[1-9][0-9]{0,19}$/.test(id)) throw new ImportError('invalidUrl');
  const result = await requestApple([id], options);
  return { ...normalizeApple(result.data, id), fetched_at: result.fetched_at };
}

export async function lookupAppleBatch(ids: string[], options: AppleLookupOptions = {}) {
  if (
    !ids.length ||
    ids.length > 20 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !/^[1-9][0-9]{0,19}$/.test(id))
  )
    throw new ImportError('invalidUrl');
  const { data, fetched_at } = await requestApple(ids, options);
  const body = data as { resultCount?: unknown; results?: unknown[] } | null;
  if (
    !Array.isArray(body?.results) ||
    body.resultCount !== body.results.length ||
    body.results.length > ids.length
  )
    throw new ImportError('malformed');
  const results = new Map<string, unknown>();
  for (const value of body.results) {
    const item = value as Record<string, unknown> | null;
    const id = String(item?.trackId);
    if (!ids.includes(id) || results.has(id)) throw new ImportError('malformed');
    results.set(id, value);
  }
  return ids.map((appStoreId) => {
    const value = results.get(appStoreId);
    if (!value) return { appStoreId, error: 'notFound' };
    try {
      return {
        appStoreId,
        metadata: {
          ...normalizeApple({ resultCount: 1, results: [value] }, appStoreId),
          fetched_at,
        },
      };
    } catch (error) {
      return { appStoreId, error: error instanceof ImportError ? error.code : 'malformed' };
    }
  });
}
