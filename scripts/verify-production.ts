import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import en from '../src/messages/en.json' with { type: 'json' };

const scenarios = [
  { name: 'production default blocks fixtures', port: 3311, variables: {}, visible: false },
  {
    name: 'explicit local QA permits fixtures',
    port: 3312,
    variables: { LOCAL_FIXTURES: 'true' },
    visible: true,
  },
  {
    name: 'Vercel blocks local override',
    port: 3313,
    variables: { LOCAL_FIXTURES: 'true', VERCEL: '1' },
    visible: false,
  },
];
for (const scenario of scenarios) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    DIRECTORY_DATA_SOURCE: 'fixtures',
  };
  delete env.LOCAL_FIXTURES;
  delete env.VERCEL;
  Object.assign(env, scenario.variables);
  const server = spawn(
    process.execPath,
    [
      'node_modules/next/dist/bin/next',
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(scenario.port),
    ],
    { env, stdio: 'ignore' },
  );
  const base = `http://127.0.0.1:${scenario.port}`;
  try {
    let html;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`Server exited with ${server.exitCode}`);
      try {
        const response = await fetch(`${base}/en`);
        if (response.ok) {
          html = await response.text();
          break;
        }
      } catch {
        /* server starting */
      }
      await delay(100);
    }
    assert.ok(html, 'Production server did not become ready');
    assert.equal(html.includes('data-testid="app-card"'), scenario.visible);
    assert.equal(html.includes('Paper Grove'), scenario.visible);
    if (scenario.variables.VERCEL) {
      assert.ok(
        !html.includes('data-testid="device-model"'),
        'Interactive concept appears on hosted page',
      );
      assert.ok(
        !html.includes('/device/iphone-duo-render.png'),
        'Prototype render appears on hosted page',
      );
      assert.equal((await fetch(`${base}/device/iphone-duo-render.png`)).status, 404);
    }
    if (!scenario.visible) {
      assert.ok(html.includes(en.Directory.unavailableTitle));
      const detail = await (await fetch(`${base}/en/apps/sample-01`)).text();
      assert.ok(!detail.includes('Paper Grove'), 'Fixture detail leaked');
    }
    const login = await (await fetch(`${base}/en/admin/login`)).text();
    assert.ok(
      login.includes(en.Admin.errors.authUnavailable),
      'Production local authentication unexpectedly enabled',
    );
    const privatePage = await fetch(`${base}/en/admin/apps`, {
      headers: { cookie: 'duo-local-admin=forged-local-session' },
    });
    const privateHtml = await privatePage.text();
    // Next may send a streamed redirect after headers have already been committed.
    assert.ok(
      privatePage.url.includes('/admin/login?error=authRequired') ||
        /<meta[^>]+content="[^"]*url=\/en\/admin\/login\?error=authRequired"/.test(privateHtml),
      'Missing login redirect',
    );
    assert.ok(
      !/<a\b[^>]*href="\/en\/admin\/apps\/new"/.test(privateHtml),
      'Private admin UI leaked',
    );
    const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
    assert.ok(!sitemap.includes('/apps/sample-'), 'Fixture sitemap leaked');
    console.log(`PASS ${scenario.name}`);
  } finally {
    server.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once('exit', () => resolve());
    });
  }
}
