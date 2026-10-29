import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './lib/environment.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const envFile = fileURLToPath(new URL('../.env.local', import.meta.url));
const action = process.argv[2];

try {
  if (!['status', 'env'].includes(action) || process.argv.length !== 3) {
    throw new Error('Usage: npm run db:status or npm run db:env');
  }
  if (action === 'env' && existsSync(envFile)) {
    throw new Error(
      '.env.local already exists; no changes made. Review it manually before replacing it.',
    );
  }
  if (action === 'status') {
    let services;
    try {
      const output = execFileSync('docker', ['compose', 'ps', '--all', '--format', 'json'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      }).trim();
      services = output.startsWith('[')
        ? JSON.parse(output)
        : output
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line));
      if (!Array.isArray(services)) throw new Error('Unexpected Compose status.');
    } catch {
      throw new Error('Unable to read local PostgreSQL status. Check Docker and npm run db:start.');
    }
    if (!services.length) console.log('Local PostgreSQL is not started. Run npm run db:start.');
    for (const service of services) {
      console.log(`${service.Service}: ${service.State} (${service.Health || 'no health status'})`);
    }
  } else {
    const values = {
      DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/duo_ready',
      NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000',
      LOCAL_FIXTURES: 'false',
    };
    const result = validateEnvironment(values, 'local');
    if (result.errors.length) throw new Error('Invalid local PostgreSQL environment template.');
    const content = [
      '# Local PostgreSQL only. DATABASE_URL is server-only and must never use NEXT_PUBLIC_.',
      '# These development credentials are not for hosted environments.',
      '# App directory reads are still local fixtures until 002/003 is implemented.',
      ...Object.entries(values).map(([name, value]) => `${name}=${JSON.stringify(value)}`),
      '',
    ].join('\n');
    writeFileSync(envFile, content, { flag: 'wx', mode: 0o600 });
    console.log(
      'Created .env.local with server-only local PostgreSQL configuration. Existing files are never overwritten.',
    );
    console.log(
      'Run npm run env:check and npm run db:check; restart npm run dev to reload settings.',
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local PostgreSQL setup failed.');
  process.exitCode = 1;
}
