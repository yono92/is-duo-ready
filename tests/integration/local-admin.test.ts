import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { connect } from './helpers.ts';

test('explicit local bootstrap preserves settings, keeps credentials private and refuses overwrite or production', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'duo-admin-'));
  const path = join(directory, '.env.local');
  const script = fileURLToPath(new URL('../../scripts/local-admin.ts', import.meta.url));
  const client = await connect();
  try {
    const original = '# existing setting\nNEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000\n';
    await writeFile(path, original, { mode: 0o600 });
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: process.env.DUO_TEST_DATABASE_URL,
    };
    for (const key of Object.keys(env))
      if (
        key.startsWith('LOCAL_ADMIN_') ||
        key.startsWith('VERCEL') ||
        key.startsWith('NEXT_PUBLIC_SUPABASE') ||
        key === '__NEXT_PROCESSED_ENV'
      )
        delete env[key];
    const denied = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), script], {
      cwd: directory,
      env: { ...env, NODE_ENV: 'production' },
      encoding: 'utf8',
    });
    assert.equal(denied.status, 1);
    assert.equal(await readFile(path, 'utf8'), original);
    const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), script], {
      cwd: directory,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const content = await readFile(path, 'utf8');
    assert.ok(content.startsWith(original));
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    const actor = content.match(/^LOCAL_ADMIN_USER_ID=(.+)$/m)![1];
    const password = content.match(/^LOCAL_ADMIN_PASSWORD=(.+)$/m)![1];
    assert.equal(
      (await client.query('SELECT enabled FROM app_private.admin_users WHERE user_id=$1', [actor]))
        .rows[0].enabled,
      true,
    );
    assert.ok(password.length >= 32);
    assert.ok(!(result.stdout + result.stderr).includes(password));
    assert.ok(!(result.stdout + result.stderr).includes(env.DATABASE_URL!));
    const again = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), script], {
      cwd: directory,
      env,
      encoding: 'utf8',
    });
    assert.equal(again.status, 1);
    assert.equal(await readFile(path, 'utf8'), content);
  } finally {
    await client.end();
    await rm(directory, { recursive: true, force: true });
  }
});
