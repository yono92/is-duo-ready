import { describe, expect, it } from 'vitest';
import {
  allowedIPv4,
  monitorUrl,
  robotsAllows,
  fetchOfficial,
} from '../../src/lib/collection/web.mjs';

describe('official source boundary', () => {
  it('rejects private, reserved, literal IP and unapproved host URLs', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.1.1',
      '172.16.0.1',
      '192.168.0.1',
      '169.254.169.254',
      '100.64.0.1',
      '192.0.2.1',
      '198.18.0.1',
      '0.0.0.0',
      '224.0.0.1',
      '::1',
    ])
      expect(allowedIPv4(ip)).toBe(false);
    expect(allowedIPv4('8.8.8.8')).toBe(true);
    for (const raw of [
      'http://example.com/',
      'https://127.0.0.1/',
      'https://example.com@localhost/',
      'https://example.com:444/',
      'https://example.com/#x',
      'https://sub.example.com/',
    ])
      expect(() => monitorUrl(raw, 'example.com')).toThrow();
    expect(monitorUrl('https://example.com/news', 'example.com').hostname).toBe('example.com');
  });
  it('honors applicable robots disallows conservatively', () => {
    expect(robotsAllows('User-agent: *\nDisallow: /private', '/private/article')).toBe(false);
    expect(
      robotsAllows('User-agent: Other\nDisallow: /\n\nUser-agent: *\nDisallow:', '/article'),
    ).toBe(true);
    expect(robotsAllows('User-agent: DuoReadyCollector\nDisallow: /*?', '/article?x')).toBe(false);
    expect(robotsAllows('User-agent: *\nCrawl-delay: 60', '/article')).toBe(false);
    expect(robotsAllows('User-agent: *\nDisallow: /private', '/%70rivate')).toBe(false);
    expect(robotsAllows('User-agent: *\nDisallow: /*/foo$', '/foo/x/foo')).toBe(false);
    expect(robotsAllows('User-agent: *\nDisallow: /private$', '/private/page')).toBe(true);
  });
  it('never follows redirects or proceeds after robots refusal', async () => {
    let calls = 0;
    const request = async () => {
      calls++;
      return { status: 302, headers: {}, text: '' };
    };
    await expect(
      fetchOfficial('https://example.com/news', 'example.com', {
        requester: request,
        beforeAttempt: async () => {},
        sleep: async () => {},
      }),
    ).rejects.toThrow('robots');
    expect(calls).toBe(1);
    calls = 0;
    await expect(
      fetchOfficial('https://example.com/news', 'example.com', {
        requester: async () => ({ status: ++calls === 1 ? 404 : 302, headers: {}, text: '' }),
        beforeAttempt: async () => {},
      }),
    ).rejects.toThrow('redirect');
    expect(calls).toBe(2);
  });
  it('separates web parsing from API and bounds retries', async () => {
    const result = await fetchOfficial('https://example.com/news', 'example.com', {
      requester: async (url: string) => ({
        status: 200,
        headers: { 'content-type': url.endsWith('/robots.txt') ? 'text/plain' : 'text/html' },
        text: url.endsWith('/robots.txt')
          ? 'User-agent: *\nDisallow:'
          : '<h1>New update</h1><script>bad()</script><p>Supports feature</p>',
      }),
      beforeAttempt: async () => {},
    });
    expect(result.text).toBe('New update Supports feature');
    let count = 0;
    await expect(
      fetchOfficial('https://example.com/news', 'example.com', {
        requester: async () => {
          count++;
          throw new Error('network');
        },
        beforeAttempt: async () => {},
        sleep: async () => {},
      }),
    ).rejects.toThrow();
    expect(count).toBe(3);
  });
});

// Exercise the transport seam: the actual request receives a pinned resolver, not a second DNS lookup.
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { requestText } from '../../src/lib/collection/web.mjs';
it('pins a validated public DNS result and rejects mixed private answers before opening a socket', async () => {
  let opened = 0;
  const request = (
    _url: URL,
    options: {
      lookup: (
        host: string,
        opts: { all: boolean },
        callback: (error: null, addresses: { address: string }[]) => void,
      ) => void;
    },
    callback: (
      response: PassThrough & { statusCode: number; headers: Record<string, string> },
    ) => void,
  ) => {
    opened++;
    options.lookup('example.com', { all: true }, (_error, addresses) =>
      expect(addresses[0].address).toBe('8.8.8.8'),
    );
    const response = Object.assign(new PassThrough(), {
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
    });
    const req = Object.assign(new EventEmitter(), {
      end: () => {
        callback(response);
        response.end('safe text');
      },
    });
    return req;
  };
  const result = await requestText('https://example.com/news', 'example.com', {
    resolver: async () => [{ address: '8.8.8.8' }],
    request,
  });
  expect(result.text).toBe('safe text');
  expect(opened).toBe(1);
  await expect(
    requestText('https://example.com/news', 'example.com', {
      resolver: async () => [{ address: '8.8.8.8' }, { address: '127.0.0.1' }],
      request,
    }),
  ).rejects.toThrow('blockedAddress');
  expect(opened).toBe(1);
});
it('bounds DNS resolution, redirects and streamed body size', async () => {
  await expect(
    requestText('https://example.com/news', 'example.com', {
      resolver: () => new Promise(() => {}),
      timeoutMs: 5,
    }),
  ).rejects.toThrow('timeout');
  for (const [status, body, code] of [
    [302, '', 'redirect'],
    [200, 'a'.repeat(2097153), 'oversized'],
  ] as const) {
    const request = (
      _url: URL,
      _options: unknown,
      callback: (
        response: PassThrough & { statusCode: number; headers: Record<string, string> },
      ) => void,
    ) => {
      const response = Object.assign(new PassThrough(), { statusCode: status, headers: {} });
      return Object.assign(new EventEmitter(), {
        end: () => {
          callback(response);
          if (!response.destroyed) response.end(body);
        },
      });
    };
    await expect(
      requestText('https://example.com/news', 'example.com', {
        resolver: async () => [{ address: '8.8.8.8' }],
        request,
      }),
    ).rejects.toThrow(code);
  }
});

import { spawnSync } from 'node:child_process';
it('refuses the local scheduler in hosted and production environments before opening a database', () => {
  for (const env of [
    { VERCEL: '1' },
    { VERCEL_ENV: 'preview' },
    { NODE_ENV: 'production' },
  ] as const) {
    const result = spawnSync(process.execPath, ['scripts/collect.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Local collection could not run');
    expect(result.stderr).not.toContain('postgresql://');
  }
});
it('aborts a stalled response body at the overall deadline', async () => {
  let aborted = false;
  const request = (
    _url: URL,
    options: { signal: AbortSignal },
    callback: (
      response: PassThrough & { statusCode: number; headers: Record<string, string> },
    ) => void,
  ) => {
    const response = Object.assign(new PassThrough(), { statusCode: 200, headers: {} });
    const req = Object.assign(new EventEmitter(), { end: () => callback(response) });
    options.signal.addEventListener('abort', () => {
      aborted = true;
      response.destroy();
      req.emit('error', new Error('aborted'));
    });
    return req;
  };
  await expect(
    requestText('https://example.com/news', 'example.com', {
      resolver: async () => [{ address: '8.8.8.8' }],
      request,
      timeoutMs: 5,
    }),
  ).rejects.toThrow('timeout');
  expect(aborted).toBe(true);
});
