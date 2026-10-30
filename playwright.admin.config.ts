import { defineConfig, devices } from '@playwright/test';
if (!process.env.DUO_TEST_DATABASE_URL || process.env.DUO_TEST_RUN !== '1') {
  throw new Error('Run npm run test:admin to provision the isolated test database.');
}
const port = Number(process.env.DUO_TEST_PORT ?? 3350);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid test port.');
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: [
    'admin.spec.ts',
    'public-data.spec.ts',
    'import.spec.ts',
    'import-control.spec.ts',
    'operations.spec.ts',
    'icons.spec.ts',
  ],
  workers: 1,
  // Split individual tests across isolated CI runners; each runner still uses
  // one worker because tests can change database permissions.
  fullyParallel: true,
  retries: 0,
  timeout: 60000,
  reporter: [['list']],
  outputDir: process.env.DUO_TEST_PORT ? `test-results/admin-${port}` : 'test-results/admin',
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/en/admin/login`,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
