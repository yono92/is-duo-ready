import type { IncomingHttpHeaders } from 'node:http';
import type { LookupAddress } from 'node:dns';
export interface TextResponse {
  status: number;
  headers: IncomingHttpHeaders;
  text: string;
}
export interface RequestOptions {
  timeoutMs?: number;
  resolver?: (
    host: string,
    options: { all: true; family: number; verbatim: boolean },
  ) => Promise<LookupAddress[]>;
  request?: typeof https.request;
}
export interface OfficialOptions {
  requester?: (raw: string, host: string) => Promise<TextResponse>;
  sleep?: (ms: number) => Promise<void>;
  beforeAttempt?: () => Promise<void>;
}
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIPv4 } from 'node:net';

export class CollectionError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
export function allowedIPv4(address: string) {
  if (!isIPv4(address)) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}
export function monitorUrl(raw: string, approvedHost: string) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new CollectionError('invalid');
  }
  if (
    typeof raw !== 'string' ||
    raw.length > 2000 ||
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    url.hostname !== approvedHost ||
    !/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(url.hostname) ||
    /(?:^|\.)(local|localhost|internal|test|invalid)$/.test(url.hostname)
  )
    throw new CollectionError('invalid');
  return url;
}

/** DNS + TLS + entire body share one deadline. No redirect, compression or socket reuse. */
export async function requestText(
  raw: string,
  host: string,
  options: RequestOptions = {},
): Promise<TextResponse> {
  const url = monitorUrl(raw, host);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  try {
    const addresses = await Promise.race([
      options.resolver
        ? options.resolver(url.hostname, { all: true, family: 4, verbatim: true })
        : lookup(url.hostname, { all: true, family: 4, verbatim: true }),
      new Promise<never>((_, reject) =>
        controller.signal.addEventListener('abort', () => reject(new CollectionError('timeout')), {
          once: true,
        }),
      ),
    ]);
    if (!addresses.length || addresses.some(({ address }) => !allowedIPv4(address)))
      throw new CollectionError('blockedAddress');
    const address = addresses[0].address;
    return await new Promise<TextResponse>((resolve, reject) => {
      const request = (options.request ?? https.request)(
        url,
        {
          method: 'GET',
          agent: false,
          signal: controller.signal,
          headers: {
            'User-Agent': 'DuoReadyCollector/1.0',
            Accept: 'text/html,text/plain',
            'Accept-Encoding': 'identity',
          },
          // Preserve original hostname for TLS/SNI. DNS cannot change between validation and connection.
          lookup: (_hostname, opts, callback) =>
            opts.all ? callback(null, [{ address, family: 4 }]) : callback(null, address, 4),
        },
        (response) => {
          const status = response.statusCode ?? 0;
          if (status >= 300 && status < 400) {
            response.destroy();
            reject(new CollectionError('redirect'));
            return;
          }
          if (
            response.headers['content-encoding'] &&
            response.headers['content-encoding'] !== 'identity'
          ) {
            response.destroy();
            reject(new CollectionError('encoding'));
            return;
          }
          if (Number(response.headers['content-length']) > 2097152) {
            response.destroy();
            reject(new CollectionError('oversized'));
            return;
          }
          const chunks: Buffer[] = [];
          let length = 0;
          response.on('data', (chunk) => {
            length += chunk.length;
            if (length > 2097152) {
              response.destroy();
              reject(new CollectionError('oversized'));
            } else chunks.push(chunk);
          });
          response.on('error', () => reject(new CollectionError('network')));
          response.on('end', () =>
            resolve({
              status,
              headers: response.headers,
              text: Buffer.concat(chunks).toString('utf8'),
            }),
          );
        },
      );
      request.on('error', () =>
        reject(new CollectionError(controller.signal.aborted ? 'timeout' : 'network')),
      );
      request.end();
    });
  } catch (error) {
    if (controller.signal.aborted) throw new CollectionError('timeout');
    if (error instanceof CollectionError) throw error;
    throw new CollectionError('network');
  } finally {
    clearTimeout(timer);
  }
}

// Conservative robots subset: applicable Disallow wins, including over Allow.
// Unknown/long crawl delays fail closed rather than silently crawling faster.
export function robotsAllows(text: string, path: string) {
  const normalize = (value: string) =>
    value.replace(/%[0-9a-f]{2}/gi, (code) => {
      const char = String.fromCharCode(parseInt(code.slice(1), 16));
      return /[a-z0-9._~-]/i.test(char) ? char : code.toUpperCase();
    });
  path = normalize(path);
  let agents: string[] = [];
  let directives = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = normalize(line.slice(colon + 1).trim());
    if (key === 'user-agent') {
      if (directives) {
        agents = [];
        directives = false;
      }
      agents.push(value.toLowerCase());
      continue;
    }
    directives = true;
    if (
      !agents.some((a) => a === '*' || a === 'duoreadycollector' || a === 'duoreadycollector/1.0')
    )
      continue;
    if (key === 'crawl-delay' && (!/^\d+(\.\d+)?$/.test(value) || Number(value) > 3)) return false;
    if (key === 'disallow' && value) {
      // Match wildcard rules without a backtracking regular expression.
      if (value.length > 2000) return false;
      const anchored = value.endsWith('$');
      const pattern = anchored ? value.slice(0, -1) : value;
      let pi = 0,
        si = 0,
        star = -1,
        restart = 0;
      while (si < path.length) {
        if (pi === pattern.length && !anchored) return false;
        if (pattern[pi] === '*') {
          star = pi++;
          restart = si;
        } else if (pattern[pi] === path[si]) {
          pi++;
          si++;
        } else if (star >= 0) {
          pi = star + 1;
          si = ++restart;
        } else break;
      }
      while (pattern[pi] === '*') pi++;
      if (pi === pattern.length && (!anchored || si === path.length)) return false;
    }
  }
  return true;
}
function plainText(html: string) {
  // Bounded linear scan; malformed markup must not trigger regex backtracking.
  const lower = html.toLowerCase();
  const chunks: string[] = [];
  let position = 0;
  while (position < html.length) {
    const open = html.indexOf('<', position);
    if (open < 0) {
      chunks.push(html.slice(position));
      break;
    }
    chunks.push(html.slice(position, open), ' ');
    if (lower.startsWith('<!--', open)) {
      const close = lower.indexOf('-->', open + 4);
      if (close < 0) break;
      position = close + 3;
      continue;
    }
    const close = html.indexOf('>', open + 1);
    if (close < 0) break;
    const tag = /^<\s*(script|style|noscript|svg)\b/i.exec(
      html.slice(open, Math.min(close + 1, open + 40)),
    );
    if (tag) {
      const closing = lower.indexOf('</' + tag[1].toLowerCase(), close + 1);
      if (closing < 0) break;
      const end = html.indexOf('>', closing);
      if (end < 0) break;
      position = end + 1;
    } else position = close + 1;
  }
  return chunks
    .join(' ')
    .replace(
      /&(?:nbsp|amp|lt|gt|quot|#39);/g,
      (e) =>
        (
          ({
            '&nbsp;': ' ',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
          }) as Record<string, string>
        )[e],
    )
    .replace(/\s+/g, ' ')
    .trim();
}
export async function fetchOfficial(raw: string, host: string, options: OfficialOptions = {}) {
  const url = monitorUrl(raw, host);
  const requester = options.requester ?? requestText;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let attempt = 0; attempt < 3; attempt++) {
    await options.beforeAttempt?.();
    try {
      let robots;
      try {
        robots = await requester(new URL('/robots.txt', url).toString(), host);
      } catch (error) {
        if (error instanceof CollectionError && !['network', 'timeout'].includes(error.code))
          throw new CollectionError('robots');
        throw error;
      }
      if (
        robots.status !== 404 &&
        (robots.status !== 200 ||
          String(robots.headers['content-type'] ?? '')
            .split(';')[0]
            .toLowerCase() !== 'text/plain' ||
          !robotsAllows(robots.text, url.pathname + url.search))
      )
        throw new CollectionError('robots');
      await sleep(3000);
      const response = await requester(url.toString(), host);
      if (response.status >= 300 && response.status < 400) throw new CollectionError('redirect');
      if (response.status === 429 || response.status >= 500) throw new CollectionError('upstream');
      if (response.status !== 200) throw new CollectionError('http');
      const type = String(response.headers['content-type'] ?? '')
        .split(';')[0]
        .toLowerCase();
      if (!['text/html', 'text/plain', 'application/xhtml+xml'].includes(type))
        throw new CollectionError('contentType');
      const text = type === 'text/plain' ? response.text.trim() : plainText(response.text);
      if (!text) throw new CollectionError('empty');
      // Keep bounded excerpts for human comparison; hash full normalized content separately.
      const { createHash } = await import('node:crypto');
      return {
        source_url: url.toString(),
        text: text.slice(0, 20000),
        content_hash: createHash('sha256').update(text).digest('hex'),
        truncated: text.length > 20000,
      };
    } catch (error) {
      const safe = error instanceof CollectionError ? error : new CollectionError('network');
      if (attempt === 2 || !['network', 'timeout', 'upstream'].includes(safe.code)) throw safe;
      await sleep(1000 * 2 ** attempt);
    }
  }
  throw new CollectionError('network');
}
